// Global variable for the selected x-axis variable
let currentXAxis = "Sleep_Quality";

function drawBarChart(data, containerId = "chart") {

    // Calculate dynamic width based on the number of data points
    const container = d3.select(`#${containerId}`);
    // Clear the container
    container.selectAll("*").remove();

    const numBars = data.length;
    const barWidth = 50; // Minimum width per bar
    const containerWidth = Math.max(numBars * barWidth, container.node().getBoundingClientRect().width);
    const containerHeight = 500;

    const margin = { top: 40, right: 150, bottom: 120, left: 70 },
        width = containerWidth - margin.left - margin.right,
        height = containerHeight - margin.top - margin.bottom;

    // Add the SVG canvas
    const svg = container
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Define X-axis scale
    const x = d3.scaleBand()
        .range([0, width])
        .domain(data.map(d => d[currentXAxis]))
        .padding(0.3);

    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("z-index", "9999")
        .style("background-color", "white")
        .style("border", "1px solid black")
        .style("padding", "5px")
        .style("border-radius", "5px")
        .style("font-size", "12px")
        .style("pointer-events", "none");

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-25)") // Rotate labels for readability
        .style("text-anchor", "end")
        .style("font-size", "12px");

    // Define Y-axis scale
    const y = d3.scaleLinear()
        .domain([0, Math.ceil(d3.max(data, d => d.count))])
        .range([height, 0]);

    svg.append("g")
        .call(d3.axisLeft(y).ticks(10).tickFormat(d3.format("d")))
        .style("font-size", "12px");

    // Add bars with tooltip interaction
    // Add interactivity to bars
    svg.selectAll("rect")
        .data(data)
        .join("rect")
        .attr("x", d => x(d[currentXAxis]))
        .attr("y", d => y(d.count))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.count))
        .attr("fill", "#69b3a2")
        .on("mouseover", function (event, d) {
            // Highlight the bar
            d3.select(this)
                .transition()
                .duration(200)
                .attr("fill", "#FF6347"); // Highlight color

            // Show tooltip
            d3.select(".tooltip")
                .style("visibility", "visible")
                .html(`Category: ${d[currentXAxis]}<br>Count: ${d.count}`)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY}px`);
        })
        .on("mousemove", function (event) {
            // Update tooltip position
            d3.select(".tooltip")
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY}px`);
        })
        .on("mouseout", function () {
            // Reset bar color
            d3.select(this)
                .transition()
                .duration(200)
                .attr("fill", "#69b3a2");

            // Hide tooltip
            d3.select(".tooltip").style("visibility", "hidden");
        });


    // Add labels above bars
    svg.selectAll(".bar-label")
        .data(data)
        .join("text")
        .attr("class", "bar-label")
        .attr("x", d => x(d[currentXAxis]) + x.bandwidth() / 2)
        .attr("y", d => y(d.count) - 5) // Space above bars
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text(d => d.count);

    // Add chart title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text(`Number of Students by ${currentXAxis.replace("_", " ")}`);

    // Add X-axis label
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 70)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .text(currentXAxis.replace("_", " "));

    // Add Y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -(height / 2))
        .attr("y", -margin.left + 20)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Number of Students");
}


// Function to apply filters and sort, then draw the chart
function applyFiltersAndSort(rawData) {
    const groupedData = groupData(rawData);
    console.log("Grouped Data:", groupedData);

    const sortedData = sortData(groupedData, currentSort.sortBy, currentSort.order);
    console.log("Sorted Data:", sortedData);

    if (sortedData.length === 0) {
        console.error("No data to display!");
        return;
    }
    drawBarChart(sortedData);
}


// Function to group the data
function groupData(data) {
    const groupedData = d3.rollup(
        data,
        v => v.length, // Count the number of students
        d => d[currentXAxis]
    );

    // Format the grouped data
    const formattedData = Array.from(groupedData, ([key, value]) => ({
        [currentXAxis]: key,
        count: value
    }));

    console.log("Grouped Data:", formattedData); // Log for debugging
    return formattedData;
}


// Função para ordenar os dados
function sortData(data, sortBy, order) {
    if (sortBy === "x") {
        return data.sort((a, b) =>
            order === "asc"
                ? d3.ascending(a[currentXAxis], b[currentXAxis])
                : d3.descending(a[currentXAxis], b[currentXAxis])
        );
    } else if (sortBy === "y") {
        return data.sort((a, b) =>
            order === "asc"
                ? d3.ascending(a.count, b.count)
                : d3.descending(a.count, b.count)
        );
    }
    return data;
}


document.getElementById("x-axis-select").addEventListener("change", (event) => {
    currentXAxis = event.target.value; // Update the selected X-axis variable
    applyCurrentFilters(); // Redraw the chart with the updated axis
});


// document.getElementById("y-axis-select").addEventListener("change", (event) => {
//     event.preventDefault(); // Evita comportamento padrão
//     currentYAxis = event.target.value; 
//     applyCurrentFilters(); // Atualiza o gráfico com base no novo eixo
// });

// document.querySelectorAll("a, button").forEach(el => {
//     el.addEventListener("click", (event) => {
//         if (el.getAttribute("href") === "#" || el.tagName.toLowerCase() === "button") {
//             event.preventDefault(); // Impede o comportamento padrão
//         }
//     });
// });
