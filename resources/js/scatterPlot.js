// Function to draw the scatter plot with dynamic X and Y values
function drawScatterPlot(data, xValue, yValue) {
    if (!data || data.length === 0) {
        console.error("No data available for scatter plot.");
        return;
    }

    // Limpa o gráfico anterior
    d3.select("#chart").selectAll("*").remove();

    const margin = { top: 40, right: 150, bottom: 80, left: 60 },
          width = 800 - margin.left - margin.right,
          height = 500 - margin.top - margin.bottom;

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right + 100)
        .attr("height", height + margin.top + margin.bottom + 100)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d[xValue]) + 1])
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d[yValue]) + 1])
        .range([height, 0]);

    // Eixo X
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .append("text")
        .attr("y", 50)
        .attr("x", width / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "black")
        .text(xValue.replace("_", " "));

    // Eixo Y
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
        .domain([...new Set(data.map(d => d.University_Year))]);

    // Tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip") // Certifique-se de que não conflita com estilos existentes
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "#fff")
        .style("border", "1px solid #ccc")
        .style("padding", "8px")
        .style("border-radius", "5px");

    // Desenha os pontos do scatter plot
    svg.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => x(d[xValue]))
        .attr("cy", d => y(d[yValue]))
        .attr("r", 6)
        .style("fill", d => colorScale(d.University_Year))
        .on("mouseover", (event, d) => {
            tooltip.style("visibility", "visible")
                .html(`ID: ${d.Student_ID}<br>
                       ${xValue.replace("_", " ")}: ${d[xValue]}<br>
                       ${yValue.replace("_", " ")}: ${d[yValue]}<br>
                       Year: ${d.University_Year}<br>
                       Gender: ${d.Gender}`);
        })
        .on("mousemove", event => {
            tooltip.style("top", (event.pageY - 10) + "px")
                .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", () => tooltip.style("visibility", "hidden"));

    // Legenda interativa
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
        .on("mouseover", (event, year) => highlightYear(year, svg))
        .on("mouseout", () => resetHighlight(svg));

    legend.selectAll("legend-text")
        .data(years)
        .enter()
        .append("text")
        .attr("x", 25)
        .attr("y", (d, i) => i * 25 + 15)
        .text(d => `${d}`);
}

function highlightYear(year, svg) {
    svg.selectAll("circle")
        .transition().duration(200)
        .style("opacity", d => (d.University_Year === year ? 1 : 0.1));
}

function resetHighlight(svg) {
    svg.selectAll("circle")
        .transition().duration(200)
        .style("opacity", 1);
}