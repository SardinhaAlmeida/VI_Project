// Function to draw the scatter plot with dynamic X and Y values
function drawScatterPlot(data) {
    if (!data || data.length === 0) {
        console.error("No data available for scatter plot.");
        return;
    }

    // Aplicar filtros aos dados
    let filteredData = data;

    if (selectedGender !== "All") {
        filteredData = filteredData.filter(d => d.Gender === selectedGender);
    }

    if (selectedYear !== "all") {
        filteredData = filteredData.filter(d => d.University_Year === selectedYear);
    }

    if (!filteredData || filteredData.length === 0) {
        console.error("No data available after filtering for scatter plot.");
        return;
    }

    // Limpar o gráfico anterior
    d3.select("#chart").selectAll("*").remove();

    // Dimensões e margens do gráfico
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

    const xValue = document.getElementById("x-axis-select").value || "Study_Hours";
    const yValue = document.getElementById("y-axis-select").value || "Sleep_Duration";

    // Escalas dinâmicas baseadas nos dados filtrados
    const x = d3.scaleLinear()
        .domain([0, d3.max(filteredData, d => d[xValue]) + 1]) // Calcula o domínio para o eixo X
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(filteredData, d => d[yValue]) + 1]) // Calcula o domínio para o eixo Y
        .range([height, 0]);

    // Adicionar eixo X
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .append("text")
        .attr("y", 50)
        .attr("x", width / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "black")
        .text(xValue.replace("_", " "));

    // Adicionar eixo Y
    svg.append("g")
        .call(d3.axisLeft(y))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -50)
        .attr("x", -(height / 2))
        .attr("text-anchor", "middle")
        .attr("fill", "black")
        .text(yValue.replace("_", " "));

    // Escala de cores
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
        .domain([...new Set(filteredData.map(d => d.University_Year || "Unknown"))]);

    // Tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "#fff")
        .style("border", "1px solid #ccc")
        .style("padding", "8px")
        .style("border-radius", "5px");

    // Desenhar os pontos do scatter plot
    svg.selectAll("circle")
        .data(filteredData)
        .enter()
        .append("circle")
        .attr("cx", d => x(d[xValue]) + (Math.random() - 0.5) * 5)
        .attr("cy", d => y(d[yValue]) + (Math.random() - 0.5) * 5)
        .attr("r", 4)
        .style("fill", d => colorScale(d.University_Year || "Unknown"))
        .style("opacity", 0.7)
        .on("mouseover", function (event, d) {
            // Destaque o ponto atual
            d3.select(this)
                .transition()
                .duration(200)
                .attr("r", 8)
                .style("opacity", 1);

            // Reduzir a opacidade dos outros pontos
            svg.selectAll("circle").filter(e => e !== d)
                .transition()
                .duration(200)
                .style("opacity", 0.2);

            // Atualizar a informação na div
            updateBarInfo(`
                <strong>Point Selected:</strong><br>
                <strong>${xValue.replace("_", " ")}:</strong> ${d[xValue]}<br>
                <strong>${yValue.replace("_", " ")}:</strong> ${d[yValue]}<br>
                <strong>Year:</strong> ${d.University_Year}<br>
                <strong>Gender:</strong> ${d.Gender}`);
        })
        .on("mouseout", function () {
            // Restaurar opacidade e tamanho dos pontos
            d3.select(this)
                .transition()
                .duration(200)
                .attr("r", 4)
                .style("opacity", 0.7);

            svg.selectAll("circle")
                .transition()
                .duration(200)
                .style("opacity", 0.7);

            // Remover informação da div
            updateBarInfo(null);
        });

    // Adicionar legenda
    const legend = svg.append("g")
        .attr("transform", `translate(${width + 20}, 0)`);

    const years = colorScale.domain();

    legend.selectAll("legend-item")
        .data(years)
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", (d, i) => i * 25)
        .attr("width", 20)
        .attr("height", 20)
        .style("fill", d => colorScale(d))
        .style("cursor", "pointer")
        .on("mouseover", function (event, year) {
            highlightYear(year, svg);
            d3.select(this)
                .transition().duration(200)
                .attr("x", -2.5)
                .attr("y", parseFloat(d3.select(this).attr("y")))
                .attr("width", 25)
                .attr("height", 25);
        })
        .on("mouseout", function () {
            resetHighlight(svg);
            d3.select(this)
                .transition().duration(200)
                .attr("x", 0)
                .attr("y", parseFloat(d3.select(this).attr("y")))
                .attr("width", 20)
                .attr("height", 20);
        });

    legend.selectAll("legend-text")
        .data(years)
        .enter()
        .append("text")
        .attr("x", 30)
        .attr("y", (d, i) => i * 25 + 15)
        .style("cursor", "pointer")
        .text(d => `${d}`)
        .on("mouseover", (event, year) => highlightYear(year, svg))
        .on("mouseout", () => resetHighlight(svg));
}

// Função para destacar os pontos correspondentes ao ano
function highlightYear(year, svg) {
    svg.selectAll("circle")
        .transition().duration(200)
        .style("opacity", d => (d.University_Year === year ? 1 : 0.1));
}

// Função para resetar o destaque dos pontos
function resetHighlight(svg) {
    svg.selectAll("circle")
        .transition().duration(200)
        .style("opacity", 1);
}
