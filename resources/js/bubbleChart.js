function drawBubbleChart(data) {
    if (!data || data.length === 0) {
        console.error("No data available for bubble chart.");
        return;
    }

    const xValue = document.getElementById("x-axis-select").value || "Study_Hours";
    const yValue = document.getElementById("y-axis-select").value || "Sleep_Duration";

    // Apply filters
    let filteredData = data;

    if (selectedGender !== "All") {
        filteredData = filteredData.filter(d => d.Gender === selectedGender);
    }

    if (!filteredData || filteredData.length === 0) {
        console.error("No data available after filtering for bubble chart.");
        return;
    }

    // Group data by ranges for x, y, and University_Year
    const rangeStep = 2; // Define the step size for ranges
    const groupByRange = value => Math.floor(value / rangeStep) * rangeStep;

    const groupedData = d3.rollup(
        filteredData,
        v => ({
            count: v.length, // Number of students in this group
            avgSleepQuality: d3.mean(v, d => d.Sleep_Quality),
        }),
        d => groupByRange(d[xValue]), // Group by x-range
        d => groupByRange(d[yValue]), // Group by y-range
        d => d.University_Year // Group by University_Year
    );

    // Flatten grouped data for plotting
    const flattenedData = [];
    groupedData.forEach((yGroup, xRange) => {
        yGroup.forEach((yearGroup, yRange) => {
            yearGroup.forEach((value, year) => {
                flattenedData.push({
                    x: xRange,
                    y: yRange,
                    year: year,
                    count: value.count,
                    avgSleepQuality: value.avgSleepQuality
                });
            });
        });
    });

    // Clear the previous chart
    d3.select("#chart").selectAll("*").remove();

    // Define chart dimensions
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

    // Define scales
    const x = d3.scaleLinear()
        .domain([0, d3.max(flattenedData, d => d.x) + rangeStep]) // Include the last range
        .range([0, width]);

    const y = d3.scaleLinear()
        .domain([0, d3.max(flattenedData, d => d.y) + rangeStep]) // Include the last range
        .range([height, 0]);

    const radius = d3.scaleSqrt()
        .domain([0, d3.max(flattenedData, d => d.count)])
        .range([5, 50]); // Adjust size range as needed

    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
        .domain([...new Set(filteredData.map(d => d.University_Year || "Unknown"))]);

    const circles = svg.selectAll("circle")
        .data(flattenedData)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.x))
        .attr("cy", d => y(d.y))
        .attr("r", d => radius(d.count))
        .style("fill", d => colorScale(d.year))
        .style("opacity", 0.8)
    
    // Add axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d => `${d}-${d + rangeStep - 1}`))
        .append("text")
        .attr("y", 50)
        .attr("x", width / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "black")
        .text(xValue.replace("_", " "));

    svg.append("g")
        .call(d3.axisLeft(y).tickFormat(d => `${d}-${d + rangeStep - 1}`))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -50)
        .attr("x", -(height / 2))
        .attr("text-anchor", "middle")
        .attr("fill", "black")
        .text(yValue.replace("_", " "));

    console.log("Antes de criar a tooltip");
    // Tooltip setup
    // Tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip") // Certifique-se de que não conflita com estilos existentes
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "#fff")
        .style("border", "1px solid #ccc")
        .style("padding", "8px")
        .style("border-radius", "5px");
    console.log("Depois de criar a tooltip");


    // Add bubbles
    svg.selectAll("circle")
        .data(flattenedData)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.x))
        .attr("cy", d => y(d.y))
        .attr("r", d => radius(d.count))
        .style("fill", d => colorScale(d.year))
        .style("opacity", 0.8)
        circles.on("mouseover", (event, d) => {
            tooltip.style("visibility", "visible")
                .html(`
                    <strong>X Range:</strong> ${d.x}-${d.x + rangeStep - 1}<br>
                    <strong>Y Range:</strong> ${d.y}-${d.y + rangeStep - 1}<br>
                    <strong>Year:</strong> ${d.year}<br>
                    <strong>Number of Students:</strong> ${d.count}<br>
                    <strong>Average Sleep Quality:</strong> ${d.avgSleepQuality ? d.avgSleepQuality.toFixed(2) : "N/A"}
                `)
                .style("left", `${event.pageX + 15}px`)
                .style("top", `${event.pageY - 30}px`);
        })
        .on("mousemove", event => {
            tooltip.style("left", `${event.pageX + 15}px`)
                   .style("top", `${event.pageY - 30}px`);
        })
        .on("mouseout", () => {
            tooltip.style("visibility", "hidden");
        });
        

    // Legend for university years
    const legend = svg.append("g")
        .attr("transform", `translate(${width + 20}, 0)`);

    const years = colorScale.domain();

    legend.selectAll("rect")
        .data(colorScale.domain())
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", (d, i) => i * 25)
        .attr("width", 20)
        .attr("height", 20)
        .style("fill", d => colorScale(d));

    legend.selectAll("text")
        .data(colorScale.domain())
        .enter()
        .append("text")
        .attr("x", 30)
        .attr("y", (d, i) => i * 25 + 15)
        .text(d => d);

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
            circles.transition().duration(200)
                .style("opacity", d => d.year === year ? 1 : 0.1);
        })
        .on("mouseout", function () {
            circles.transition().duration(200)
                .style("opacity", 1);
        });

    legend.selectAll("legend-text")
        .data(years)
        .enter()
        .append("text")
        .attr("x", 30)
        .attr("y", (d, i) => i * 25 + 15)
        .style("cursor", "pointer")
        .text(d => d)
        .on("mouseover", function (event, year) {
            circles.transition().duration(200)
                .style("opacity", d => d.year === year ? 1 : 0.1);
        })
        .on("mouseout", function () {
            circles.transition().duration(200)
                .style("opacity", 1);
        });
}
