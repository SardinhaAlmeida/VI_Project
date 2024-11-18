function drawBarChart(data) {
    console.log("Data passed to drawBarChart:", data);

    d3.select("#chart").selectAll("*").remove(); // Clear the previous chart

    const margin = { top: 60, right: 30, bottom: 90, left: 60 },
          width = 800 - margin.left - margin.right,
          height = 500 - margin.top - margin.bottom;

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Dynamically get x-axis variable
    const xAxisVariable = currentXAxis || "Sleep_Quality";

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
        .domain([0, d3.max(data, d => d.count)])
        .range([height, 0]);

    svg.append("g")
        .call(d3.axisLeft(y));

    // Add bars
    svg.selectAll("rect")
        .data(data)
        .join("rect")
        .attr("x", d => x(d[xAxisVariable]))
        .attr("y", d => y(d.count))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.count))
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
        .text(`Number of Students by ${xAxisVariable.replace("_", " ")}`);

    // Add dropdown for x-axis legend
    svg.append("foreignObject")
        .attr("x", width / 2 - 50) // Centered on x-axis
        .attr("y", height + margin.bottom - 50) // Positioned below the x-axis
        .attr("width", 120) // Adjust width to fit dropdown
        .attr("height", 30) // Adjust height
        .append("xhtml:div")
        .html(`
            <select id="x-axis-dropdown" style="font-size: 14px;">
                <option value="Sleep_Quality" ${xAxisVariable === "Sleep_Quality" ? "selected" : ""}>Sleep Quality</option>
                <option value="Study_Hours" ${xAxisVariable === "Study_Hours" ? "selected" : ""}>Study Hours</option>
                <option value="Screen_Time" ${xAxisVariable === "Screen_Time" ? "selected" : ""}>Screen Time</option>
                <option value="Caffeine_Intake" ${xAxisVariable === "Caffeine_Intake" ? "selected" : ""}>Caffeine Intake</option>
                <option value="Physical_Activity" ${xAxisVariable === "Physical_Activity" ? "selected" : ""}>Physical Activity</option>
                <option value="Sleep_Duration" ${xAxisVariable === "Sleep_Duration" ? "selected" : ""}>Sleep Duration</option>
            </select>
        `);

    // Add event listener to the dropdown
    document.getElementById("x-axis-dropdown").addEventListener("change", (event) => {
        currentXAxis = event.target.value; // Update global x-axis variable
        applyCurrentFilters(); // Reapply filters and redraw the chart
        // drawBarChart(data); // Redraw chart
    });

    // Add Y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 20)
        .attr("x", -(height / 2))
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Number of Students");
}

// Global variable for the selected x-axis variable
let currentXAxis = "Sleep_Quality";


// Função para agrupar e aplicar filtros
function applyFiltersAndSort(rawData) {
    const groupedData = groupData(rawData);
    console.log("Grouped Data:", groupedData);
    
    const sortedData = sortData(groupedData, currentSort.sortBy, currentSort.order);
    console.log("Sorted Data:", sortedData);
    
    drawBarChart(sortedData);
}


// Função para agrupar os dados
function groupData(data) {
    const groupedData = d3.rollup(
        data,
        v => v.length, // Count the number of occurrences for each category
        d => d[currentXAxis] // Use the currentXAxis variable to group
    );
    
    // Format grouped data into a readable format for the chart
    const formattedData = Array.from(groupedData, ([key, value]) => ({
        [currentXAxis]: key, count: value
    }));
    
    console.log("Grouped Data:", formattedData); // Debugging log to ensure correct grouping
    return formattedData;
}


// Função para ordenar os dados
function sortData(data, sortBy, order) {
    if (sortBy === "x") {
        return data.sort((a, b) => order === "asc" ? d3.ascending(a[currentXAxis], b[currentXAxis]) : d3.descending(a[currentXAxis], b[currentXAxis]));
    } else if (sortBy === "y") {
        return data.sort((a, b) => order === "asc" ? d3.ascending(a.count, b.count) : d3.descending(a.count, b.count));
    }
    return data;
}
