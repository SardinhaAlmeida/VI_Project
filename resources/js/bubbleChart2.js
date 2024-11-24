function drawBubbleChart(data) {
    if (!data || data.length === 0) {
        console.error("No data available for bubble chart.");
        return;
    }

    // Obter os valores dos eixos a partir dos dropdowns
    const xValue = document.getElementById("x-axis-select").value || "Caffeine_Intake";
    const yValue = document.getElementById("y-axis-select").value || "Physical_Activity";
    const groupValue = "Sleep_Quality";

    console.log(`Selected X-axis: ${xValue}, Y-axis: ${yValue}`);

    // Aplicar filtros
    let filteredData = data;

    if (selectedGender !== "All") {
        filteredData = filteredData.filter(d => d.Gender === selectedGender);
    }

    if (selectedYear !== "all") {
        filteredData = filteredData.filter(d => d.University_Year === selectedYear);
    }

    if (!filteredData || filteredData.length === 0) {
        console.error("No data available after filtering.");
        return;
    }

    // Definir intervalos de agrupamento com base na variável Y
    let yRangeStep;
    switch (yValue) {
        case "Sleep_Quality":
            yRangeStep = 2; // Intervalos de 2
            break;
        case "Sleep_Duration":
            yRangeStep = 3; // Intervalos de 3
            break;
        case "Study_Hours":
            yRangeStep = 3; // Intervalos de 3
            break;
        case "Screen_Time":
            yRangeStep = 1; // Intervalos de 1
            break;
        case "Caffeine_Intake":
            yRangeStep = 1; // Intervalos de 1
            break;
        case "Physical_Activity":
        default:
            yRangeStep = 20; // Intervalos de 20 (padrão)
            break;
    }

    // Função para agrupar valores no eixo Y
    const groupByYRange = value => Math.floor(value / yRangeStep) * yRangeStep;

    // Agrupar dados por xValue e yValue (com intervalos para o eixo Y)
    const groupedData = d3.rollup(
        filteredData,
        v => ({
            count: v.length,
            sleepQuality: d3.mean(v, d => d[groupValue]),
        }),
        d => d[xValue],
        d => groupByYRange(d[yValue])
    );

    // Transformar os dados agrupados para o formato plano
    const flattenedData = [];
    groupedData.forEach((yGroup, xKey) => {
        yGroup.forEach((value, yRange) => {
            flattenedData.push({
                x: xKey,
                y: yRange,
                count: value.count,
                sleepQuality: value.sleepQuality,
            });
        });
    });

    if (!flattenedData || flattenedData.length === 0) {
        console.error("No data available after grouping.");
        return;
    }

    // Limpar o gráfico anterior
    d3.select("#chart").selectAll("*").remove();

    // Dimensões do gráfico
    const containerWidth = d3.select("#chart").node().getBoundingClientRect().width;
    const containerHeight = 500;

    const margin = { top: 40, right: 150, bottom: 80, left: 60 },
        width = containerWidth - margin.left - margin.right,
        height = containerHeight - margin.top - margin.bottom;

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right + 100) // Ajustar para a legenda
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Escalas
    const x = d3.scaleBand()
        .domain([...new Set(flattenedData.map(d => d.x))].sort((a, b) => a - b))
        .range([0, width])
        .padding(0.2);

    const y = d3.scaleBand()
        .domain([...new Set(flattenedData.map(d => d.y))].sort((a, b) => a - b))
        .range([height, 0])
        .padding(0.2);

    const radius = d3.scaleSqrt()
        .domain([0, d3.max(flattenedData, d => d.count)])
        .range([3, 50]);

    const colorScale = d3.scaleSequential(d3.interpolateBlues)
        .domain(d3.extent(flattenedData, d => d.sleepQuality));

    // Adicionar eixos
    const xAxis = svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    if (x.domain().length > 10) {
        xAxis.selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");
    }

    svg.append("g")
        .call(d3.axisLeft(y).tickFormat(d => {
            if (yRangeStep === 1) {
                return `${d}`;
            } else {
                return `${d}-${d + yRangeStep - 1}`;
            }
        }));

    // Labels dos eixos
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 20)
        .attr("text-anchor", "middle")
        .attr("fill", "black")
        .text(xValue.replace("_", " "));

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 20)
        .attr("x", -height / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "black")
        .text(yValue.replace("_", " "));

    // Tooltip
    const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("visibility", "hidden")
    .style("position", "absolute")
    .style("background-color", "rgba(255, 255, 255, 0.9)")
    .style("border", "1px solid #ccc")
    .style("border-radius", "4px")
    .style("padding", "8px");

    // Adicionar bolhas
    svg.selectAll("circle")
    .data(flattenedData)
    .enter()
    .append("circle")
    .attr("cx", d => x(d.x) + x.bandwidth() / 2)
    .attr("cy", d => y(d.y) + y.bandwidth() / 2)
    .attr("r", d => radius(d.count))
    .style("fill", d => colorScale(d.sleepQuality))
    .style("opacity", 0.8)
    .on("click", (event, d) => {
        console.log("Bubble clicked:", d);

        d3.select("#bar-chart").style("visibility", "visible");

        drawSimpleBarChart(d.students);
    })
    .on("mouseover", (event, d) => {
        console.log("Mouseover Event Data:"); // Log mais detalhado
        console.log(`X Value (${xValue.replace("_", " ")}): ${d.x}`);
        console.log(`Y Value (${yValue.replace("_", " ")}): ${d.y}-${d.y + yRangeStep - 1}`);
        console.log(`Number of Students: ${d.count}`);
        console.log(`Average Sleep Quality: ${d.sleepQuality.toFixed(2)}`);
        
        tooltip.style("visibility", "visible")
            .html(`
                <strong>Details:</strong><br>
                ${xValue.replace("_", " ")}: ${d.x}<br>
                ${yValue.replace("_", " ")}: ${d.y}-${d.y + yRangeStep - 1}<br>
                Students: ${d.count}<br>
                Avg Sleep Quality: ${d.sleepQuality.toFixed(2)}
            `);
    })
    .on("mousemove", event => {
        tooltip.style("top", `${event.pageY + 10}px`)
            .style("left", `${event.pageX + 10}px`);
    })
    .on("mouseout", () => {
        tooltip.style("visibility", "hidden");
    });

    // Adicionar legenda
    const legend = svg.append("g")
        .attr("transform", `translate(${width + 30}, 0)`);

    legend.append("text")
        .attr("x", 0)
        .attr("y", 0)
        .text("Sleep Quality")
        .style("font-weight", "bold");

    const legendHeight = 200;
    const legendWidth = 20;

    const legendScale = d3.scaleLinear()
        .domain(colorScale.domain())
        .range([legendHeight, 0]);

    const legendAxis = d3.axisRight(legendScale)
        .ticks(5);

    const legendGradient = svg.append("defs")
        .append("linearGradient")
        .attr("id", "legend-gradient")
        .attr("x1", "0%")
        .attr("y1", "100%")
        .attr("x2", "0%")
        .attr("y2", "0%");

    legendGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", colorScale.range()[0]);

    legendGradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", colorScale.range()[1]);

    legend.append("rect")
        .attr("x", 0)
        .attr("y", 20)
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#legend-gradient)");

    legend.append("g")
        .attr("transform", `translate(${legendWidth}, 20)`)
        .call(legendAxis);
}

// Eventos para atualizar o gráfico ao mudar os eixos
document.getElementById("x-axis-select").addEventListener("change", () => drawBubbleChart(processedData));
document.getElementById("y-axis-select").addEventListener("change", () => drawBubbleChart(processedData));

// Atualizar o gráfico inicial após o DOM estar carregado
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded. Ready to manipulate charts.");
    applyCurrentFilters(); // Atualiza o gráfico inicial
});
