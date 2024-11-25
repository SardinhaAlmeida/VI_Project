function drawBubbleChart(data) {
    if (!data || data.length === 0) {
        console.error("No data available for bubble chart.");
        return;
    }

    // Obter os valores dos eixos a partir dos dropdowns
    const xValue = document.getElementById("x-axis-select").value || "Caffeine_Intake";
    const yValue = document.getElementById("y-axis-select").value || "Physical_Activity";
    const intensityValue = document.getElementById("color-intensity-select").value || "Sleep_Quality";

    console.log(`Selected X-axis: ${xValue}, Y-axis: ${yValue}, Intensity: ${intensityValue}`);

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

    // Definir intervalos de agrupamento com base nas variáveis
    let yRangeStep, xRangeStep;
    switch (yValue) {
        case "Sleep_Quality":
            yRangeStep = 2;
            xRangeStep = 2;
            break;
        case "Sleep_Duration":
            yRangeStep = 3;
            xRangeStep = 3;
            break;
        case "Study_Hours":
            yRangeStep = 3;
            xRangeStep = 3;
            break;
        case "Screen_Time":
            yRangeStep = 2;
            xRangeStep = 2;
            break;
        case "Physical_Activity":
        default:
            yRangeStep = 20;
            xRangeStep = 20;
            break;
    }

    const groupByYRange = value =>
        yValue === "Caffeine_Intake" ? value : Math.floor(value / yRangeStep) * yRangeStep;
    
    const groupByXRange = value =>
        xValue === "Caffeine_Intake" ? value : Math.floor(value / xRangeStep) * xRangeStep;
    

    // Agrupar dados por xValue e yValue
    const groupedData = d3.rollup(
        filteredData,
        v => ({
            count: v.length,
            intensity: d3.mean(v, d => d[intensityValue]),
        }),
        d => groupByXRange(d[xValue]),
        d => groupByYRange(d[yValue])
    );

    const flattenedData = [];
    groupedData.forEach((yGroup, xKey) => {
        yGroup.forEach((value, yRange) => {
            flattenedData.push({
                x: xKey,
                y: yRange,
                count: value.count,
                intensity: value.intensity,
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
        .attr("width", width + margin.left + margin.right)
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
        .domain([1, 10]); // Fixed domain for intensity values
    

    const xAxis = svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d =>
            xValue === "Caffeine_Intake" ? d : `${d}-${d + xRangeStep}`
        ))
        .style("color", "black");

    xAxis.selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end")
        .style("fill", "black");

    const yAxis = svg.append("g")
        .call(d3.axisLeft(y).tickFormat(d =>
            yValue === "Caffeine_Intake" ? d : `${d}-${d + yRangeStep}`
        ))
        .style("color", "black");

    yAxis.selectAll("text")
        .style("fill", "black");

    // Adicionar labels para os eixos
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 20)
        .attr("text-anchor", "middle")
        .style("fill", "black")
        .style("font-weight", "bold")
        .text(xValue.replace("_", " "));

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 20)
        .attr("text-anchor", "middle")
        .style("fill", "black")
        .style("font-weight", "bold")
        .text(yValue.replace("_", " "));

    // Adicionar bolhas
    svg.selectAll("circle")
        .data(flattenedData)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.x) + x.bandwidth() / 2)
        .attr("cy", d => y(d.y) + y.bandwidth() / 2)
        .attr("r", d => radius(d.count))
        .style("fill", d => colorScale(d.intensity))
        .style("opacity", 0.8)
        .on("mouseover", (event, d) => {
            // Criar uma linha com todas as variáveis e valores
            const dataLine = Object.entries(d)
                .map(([key, value]) => `${key}: ${value}`)
                .join(", ");
        
            // Adicionar o nome e o valor da variável selecionada para intensidade
            const intensityDetails = `${intensityValue}: ${d.intensity.toFixed(2)}`;
        
            // Logar tudo em uma única linha
            console.log(`Bubble Data: ${dataLine}, ${intensityDetails}`);
        
            // Atualizar a tooltip
            d3.select(".tooltip")
                .style("visibility", "visible")
                .html(`
                    <strong>Details:</strong><br>
                    ${xValue}: ${d.x}-${d.x + xRangeStep}<br>
                    ${yValue}: ${d.y}-${d.y + yRangeStep}<br>
                    Count: ${d.count}<br>
                    ${intensityValue}: ${d.intensity.toFixed(2)}
                `);
        })
        .on("mousemove", event => {
            d3.select(".tooltip")
                .style("top", `${event.pageY + 10}px`)
                .style("left", `${event.pageX + 10}px`);
        })
        .on("mouseout", () => {
            d3.select(".tooltip").style("visibility", "hidden");
        });
        

    // Adicionar legenda dinâmica
    const legend = svg.append("g")
        .attr("transform", `translate(${width + 30}, 0)`);

    legend.append("text")
        .attr("x", 0)
        .attr("y", 0)
        .text(intensityValue.replace("_", " "))
        .style("font-weight", "bold");

    const legendHeight = 200;
    const legendWidth = 20;

    const legendScale = d3.scaleLinear()
        .domain(colorScale.domain())
        .range([legendHeight, 0]);

    const legendAxis = d3.axisRight(legendScale).ticks(5);

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

// // Eventos para atualizar o gráfico ao mudar os eixos
// document.getElementById("x-axis-select").addEventListener("change", () => drawBubbleChart(processedData));
// document.getElementById("y-axis-select").addEventListener("change", () => drawBubbleChart(processedData));
// document.getElementById("color-intensity-select").addEventListener("change", () => drawBubbleChart(processedData));
function updateAxisDropdowns(selectedIntensity) {
    // Get dropdown elements
    const xAxisSelect = document.getElementById("x-axis-select");
    const yAxisSelect = document.getElementById("y-axis-select");

    // Enable all options first
    [...xAxisSelect.options].forEach(option => (option.disabled = false));
    [...yAxisSelect.options].forEach(option => (option.disabled = false));

    // Disable the selected intensity variable in both axis dropdowns
    if (selectedIntensity === "Sleep_Quality" || selectedIntensity === "Sleep_Duration") {
        [...xAxisSelect.options].forEach(option => {
            if (option.value === selectedIntensity) option.disabled = true;
        });
        [...yAxisSelect.options].forEach(option => {
            if (option.value === selectedIntensity) option.disabled = true;
        });
    }
}

// Add event listener to intensity dropdown
document.getElementById("color-intensity-select").addEventListener("change", event => {
    const selectedIntensity = event.target.value;
    updateAxisDropdowns(selectedIntensity);
    drawBubbleChart(processedData); // Redraw the chart with the new intensity variable
});

// Call the function initially to ensure dropdowns are updated on page load
updateAxisDropdowns(document.getElementById("color-intensity-select").value);
