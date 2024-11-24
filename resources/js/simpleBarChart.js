function drawSimpleBarChart(data) {
    if (!data || data.length === 0) {
        console.error("No data available for bar chart.");
        return;
    }

    // Agrupar dados pelo número de horas de sono
    const groupedData = d3.rollup(
        data,
        v => v.length, // Contar o número de estudantes
        d => d.Sleep_Duration // Agrupar por duração do sono
    );

    // Formatando os dados para o gráfico de barras
    const formattedData = Array.from(groupedData, ([key, value]) => ({
        Sleep_Duration: key,
        count: value,
    }));

    // Renderizar o gráfico
    d3.select("#bar-chart").selectAll("*").remove();

    const containerWidth = d3.select("#bar-chart").node().getBoundingClientRect().width;
    const containerHeight = 500;

    const margin = { top: 40, right: 50, bottom: 80, left: 60 },
        width = containerWidth - margin.left - margin.right,
        height = containerHeight - margin.top - margin.bottom;

    const svg = d3.select("#bar-chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
        .domain(formattedData.map(d => d.Sleep_Duration))
        .range([0, width])
        .padding(0.2);

    const y = d3.scaleLinear()
        .domain([0, d3.max(formattedData, d => d.count)])
        .range([height, 0]);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    svg.append("g")
        .call(d3.axisLeft(y));

    svg.selectAll("rect")
        .data(formattedData)
        .enter()
        .append("rect")
        .attr("x", d => x(d.Sleep_Duration))
        .attr("y", d => y(d.count))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.count))
        .attr("fill", "#69b3a2");

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .style("font-size", "20px")
        .text("Sleep Duration Distribution");
}
