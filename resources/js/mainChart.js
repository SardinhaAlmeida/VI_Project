let currentSort = { sortBy: "x", order: "asc" }; // Estado de ordenação atual

// Função para desenhar o gráfico inicial
function drawInitialChart(data) {
    currentSort = { sortBy: "x", order: "asc" }; // Define ordenação inicial
    applyFiltersAndSort(data); // Aplica filtros e ordenação inicial
}

// Função principal de criação/atualização do gráfico
function drawBarChart(data) {
    console.log("Data passed to drawBarChart:", data);

    d3.select("#chart").selectAll("*").remove(); // Limpa o gráfico anterior

    const margin = { top: 60, right: 30, bottom: 90, left: 60 },
          width = 800 - margin.left - margin.right,
          height = 500 - margin.top - margin.bottom;

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Eixo X
    const x = d3.scaleBand()
        .range([0, width])
        .domain(data.map(d => d.sleepQuality))
        .padding(0.2);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");

    // Eixo Y
    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.count)])
        .range([height, 0]);

    svg.append("g")
        .call(d3.axisLeft(y));

    // Barras
    svg.selectAll("rect")
        .data(data)
        .join(
            enter => enter.append("rect")
                .attr("x", d => x(d.sleepQuality))
                .attr("y", height)
                .attr("width", x.bandwidth())
                .attr("height", 0)
                .attr("fill", "#69b3a2")
                .transition()
                .duration(750)
                .attr("y", d => y(d.count))
                .attr("height", d => height - y(d.count))
        );

    // Adiciona labels em cima das barras
    svg.selectAll(".bar-label")
        .data(data)
        .join("text")
        .attr("class", "bar-label")
        .attr("x", d => x(d.sleepQuality) + x.bandwidth() / 2)
        .attr("y", d => y(d.count) - 5)
        .attr("text-anchor", "middle")
        .text(d => d.count);

    // Títulos
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -40) 
        .attr("text-anchor", "middle")
        .style("font-size", "20px")
        .text("Number of Students by Sleep Quality");

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 40)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Sleep Quality (1 = Poor, 10 = Excellent)");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 20)
        .attr("x", -(height / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Number of Students");
}

// Função para agrupar e aplicar filtros
function applyFiltersAndSort(rawData) {
    const groupedData = groupData(rawData);
    const sortedData = sortData(groupedData, currentSort.sortBy, currentSort.order);
    drawBarChart(sortedData);
}

// Função para agrupar os dados
function groupData(data) {
    const sleepQualityCounts = d3.rollup(
        data,
        v => v.length,
        d => d.Sleep_Quality
    );

    return Array.from(sleepQualityCounts, ([key, value]) => ({ sleepQuality: +key, count: value }));
}

// Função para ordenar os dados
function sortData(data, sortBy, order) {
    if (sortBy === "x") {
        return data.sort((a, b) => order === "asc" ? d3.ascending(a.sleepQuality, b.sleepQuality) : d3.descending(a.sleepQuality, b.sleepQuality));
    }
    return data;
}

// Função para configurar filtros
function configureFilterButtons() {
    d3.select("#all").on("click", () => applyFiltersAndSort(processedData));
    d3.select("#male").on("click", () => applyFiltersAndSort(processedData.filter(d => d.Gender === "Male")));
    d3.select("#female").on("click", () => applyFiltersAndSort(processedData.filter(d => d.Gender === "Female")));
    d3.select("#other").on("click", () => applyFiltersAndSort(processedData.filter(d => d.Gender === "Other")));
}

// Função para configurar ordenações
function configureSortButtons() {
    d3.select("#sort-x-asc").on("click", () => {
        currentSort = { sortBy: "x", order: "asc" };
        applyFiltersAndSort(processedData);
    });

    d3.select("#sort-x-desc").on("click", () => {
        currentSort = { sortBy: "x", order: "desc" };
        applyFiltersAndSort(processedData);
    });
}
