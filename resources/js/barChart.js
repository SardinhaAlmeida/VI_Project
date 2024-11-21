// Global variable for the selected x-axis variable
let currentXAxis = "Sleep_Quality";
let currentYAxis = "Caffeine_Intake";

function drawBarChart(data) {
    console.log("Data passed to drawBarChart:", data);

    d3.select("#chart").selectAll("*").remove(); 

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

    // Dynamically get x-axis variable
/*     const xAxisVariable = currentXAxis || "Sleep_Quality"; */

    // Define X-axis scale
    const x = d3.scaleBand()
        .range([0, width])
        .domain(data.map(d => d[currentXAxis]))
        .padding(0.2);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");

    // Define Y-axis scale
    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d[currentYAxis])])
        .range([height, 0]);

    svg.append("g")
        .call(d3.axisLeft(y));

    // Add bars
    svg.selectAll("rect")
        .data(data)
        .join("rect")
        .attr("x", d => x(d[currentXAxis]))
        .attr("y", d => y(d[currentYAxis]))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d[currentYAxis]))
        .attr("fill", "#69b3a2");

    // Add labels above bars
    svg.selectAll(".bar-label")
      .data(data)
      .join("text")
      .attr("class", "bar-label")
      .attr("x", d => x(d[xAxisVariable]) + x.bandwidth() / 2)
      .attr("y", d => y(d.count) - 5)
      .attr("text-anchor", "middle")
      .text(d => d.count);


    // Add chart title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .style("font-size", "20px")
        .text(`Relationship between ${currentXAxis.replace("_", " ")} and ${currentYAxis.replace("_", " ")}`);

    // Add Y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 20)
        .attr("x", -(height / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text(currentYAxis.replace("_", " "));
}

// Function to apply filters and sort, then draw the chart
function applyFiltersAndSort(rawData) {
    const groupedData = groupData(rawData);
    console.log("Grouped Data:", groupedData);
    
    const sortedData = sortData(groupedData, currentSort.sortBy, currentSort.order);
    console.log("Sorted Data:", sortedData);
    
    drawBarChart(sortedData);
}


// Function to group the data
function groupData(data) {
    const groupedData = d3.rollup(
        data,
        v => d3.mean(v, d => d[currentYAxis]), // Calcula a média para o eixo Y
        d => d[currentXAxis] // Agrupa pelo eixo X
    );

    // Formata os dados agrupados
    const formattedData = Array.from(groupedData, ([key, value]) => ({
        [currentXAxis]: key, [currentYAxis]: value
    }));

    console.log("Grouped Data:", formattedData); // Log para depuração
    return formattedData;
}


// Função para ordenar os dados
function sortData(data, sortBy, order) {
    if (sortBy === "x") {
        return data.sort((a, b) => order === "asc" ? d3.ascending(a[currentXAxis], b[currentXAxis]) : d3.descending(a[currentXAxis], b[currentXAxis]));
    } else if (sortBy === "y") {
        return data.sort((a, b) => order === "asc" ? d3.ascending(a[currentYAxis], b[currentYAxis]) : d3.descending(a[currentYAxis], b[currentYAxis]));
    }
    return data;
}

document.getElementById("x-axis-select").addEventListener("change", (event) => {
    event.preventDefault(); // Evita comportamento padrão
    currentXAxis = event.target.value; 
    applyCurrentFilters(); // Atualiza o gráfico com base no novo eixo
});

document.getElementById("y-axis-select").addEventListener("change", (event) => {
    event.preventDefault(); // Evita comportamento padrão
    currentYAxis = event.target.value; 
    applyCurrentFilters(); // Atualiza o gráfico com base no novo eixo
});

document.querySelectorAll("a, button").forEach(el => {
    el.addEventListener("click", (event) => {
        if (el.getAttribute("href") === "#" || el.tagName.toLowerCase() === "button") {
            event.preventDefault(); // Impede o comportamento padrão
        }
    });
});
