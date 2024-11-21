// Function to draw the scatter plot with dynamic X and Y values
function drawScatterPlot(data, xValue, yValue) {
    if (!data || data.length === 0) {
        console.error("No data available for scatter plot.");
        return;
    }

    // Limpa o gráfico anterior
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

    // Escalas X e Y
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
        .domain([...new Set(data.map(d => d.University_Year || "Unknown"))]);

    // Tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
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
        .attr("r", 0) // Começa com tamanho zero
        .style("fill", d => colorScale(d.University_Year || "Unknown"))
        .on("mouseover", (event, d) => {
            tooltip.style("visibility", "visible")
                .html(`ID: ${d.Student_ID}<br>
                       ${xValue.replace("_", " ")}: ${d[xValue]}<br>
                       ${yValue.replace("_", " ")}: ${d[yValue]}<br>
                       Year: ${d.University_Year || "Unknown"}<br>
                       Gender: ${d.Gender}`);
        })
        .on("mousemove", event => {
            const tooltipWidth = tooltip.node().getBoundingClientRect().width;
            const tooltipHeight = tooltip.node().getBoundingClientRect().height;
            const xPos = event.pageX + 10 + tooltipWidth > window.innerWidth
                ? event.pageX - tooltipWidth - 10
                : event.pageX + 10;
            const yPos = event.pageY - 10 + tooltipHeight > window.innerHeight
                ? event.pageY - tooltipHeight - 10
                : event.pageY + 10;

            tooltip.style("top", yPos + "px")
                .style("left", xPos + "px");
        })
        .on("mouseout", () => tooltip.style("visibility", "hidden"))
        .transition().duration(800) // Adiciona animação suave
        .attr("r", 6); // Expande os pontos ao tamanho final

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
