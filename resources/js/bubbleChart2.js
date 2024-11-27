function drawBubbleChart(data) {
    if (!data || data.length === 0) {
        console.error("No data available for bubble chart.");
        return;
    }

    // get selected filters
    const xValue = document.getElementById("x-axis-select").value || "Caffeine_Intake";
    const yValue = document.getElementById("y-axis-select").value || "Physical_Activity";
    const intensityValue = document.getElementById("color-intensity-select").value || "Sleep_Quality";

    console.log(`Selected X-axis: ${xValue}, Y-axis: ${yValue}, Intensity: ${intensityValue}`);

    //apply filters
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

    // define ranges for different variables
    let yRangeStep, xRangeStep;
    if (yValue === "Physical_Activity") {
        yRangeStep = 5;
    } else if (yValue === "Sleep_Quality") {
        yRangeStep = 1;
    } else if (yValue === "Sleep_Duration" || yValue === "Study_Hours" || yValue === "Screen_Time") {
        yRangeStep = 1;
    } else {
        yRangeStep = 1;
    }
    
    if (xValue === "Physical_Activity") {
        xRangeStep = 5;
    } else if (xValue === "Sleep_Quality") {
        xRangeStep = 1;
    } else if (xValue === "Sleep_Duration" || xValue === "Study_Hours" || xValue === "Screen_Time") {
        xRangeStep = 1;
    } else {
        xRangeStep = 1;
    }

    const groupByYRange = value =>
        Math.floor(value / yRangeStep) * yRangeStep;
    
    const groupByXRange = value =>
        Math.floor(value / xRangeStep) * xRangeStep;

    // group data by x and y ranges
    const groupedData = d3.rollup(
        filteredData,
        v => ({
            count: v.length,
            intensity: d3.mean(v, d => d[intensityValue]),
        }),
        d => groupByXRange(d[xValue]),
        d => groupByYRange(d[yValue])
    );

    // Convert the grouped data to a flat array for the bubble chart
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

    //scale for x and y
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

    // tooltip try
    // const tooltip = d3.select("body").append("div")
    //     .attr("class", "tooltip") 
    //     .style("position", "absolute")
    //     .style("visibility", "hidden")
    //     .style("background", "#fff")
    //     .style("border", "1px solid #ccc")
    //     .style("padding", "8px")
    //     .style("border-radius", "5px");
    // console.log("Depois de criar a tooltip");
    
    //update info
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

    // add x-axis label
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 20)
        .attr("text-anchor", "middle")
        .style("fill", "black")
        .style("font-weight", "bold")
        .text(xValue.replace("_", " "));

    // add y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 20)
        .attr("text-anchor", "middle")
        .style("fill", "black")
        .style("font-weight", "bold")
        .text(yValue.replace("_", " "));
    
    // Add chart title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text(`Comparing Students by ${xValue.replace("_", " ")} and ${yValue.replace("_", " ")} according to the ${intensityValue.replace("_", " ")}`);

    // add bubble chart
    svg.selectAll("circle")
        .data(flattenedData)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.x) + x.bandwidth() / 2)
        .attr("cy", d => y(d.y) + y.bandwidth() / 2)
        .attr("r", d => radius(d.count))
        .style("fill", d => colorScale(d.intensity))
        .style("opacity", 0.8)
        .on("click", (event, d) => {
            console.log(`Clicked Bubble Data: ${JSON.stringify(d)}`);

            //adjust chart containers
            const bubbleChartContainer = document.getElementById("chart");
            //for the bar chart container
            const barChartContainer = document.getElementById("bar-chart-container");

            barChartContainer.style.visibility = "visible";
            barChartContainer.style.display = "inline-block";
            bubbleChartContainer.style.width = "70%"; 
            // Filter data for the clicked bubble
            const filteredStudents = filteredData.filter(student =>
                groupByXRange(student[xValue]) === d.x &&
                groupByYRange(student[yValue]) === d.y
            );

            // Aggregate data for the selected intensity metric (e.g., Sleep Quality)
            const aggregatedData = d3.rollup(
                filteredStudents,
                v => v.length, // Count of students
                student => student[intensityValue] // Group by intensity metric
            );

            // Convert the aggregated data to an array for the bar chart
            const barChartData = Array.from(aggregatedData, ([key, value]) => ({
                category: key,
                count: value
            }));

            console.log(barChartData); //debug

            // Draw the bar chart with the aggregated data
            drawBubbleBarChart(barChartData, "bar-chart-bubble");
        })
        .on("mouseover", function (event, d) {
            //highlight the current bubble
            d3.select(this)
                .transition()
                .duration(200)
                .attr("r", d => radius(d.count) + 1)
                .style("opacity", 1);
    
            // reduce opacity of other bubbles
            svg.selectAll("circle").filter(e => e !== d)
                .transition()
                .duration(200)
                .style("opacity", 0.2);
    
            // update info
            updateBarInfo(`
                <strong>Bubble Selected:</strong><br>
                <strong>X Range:</strong> ${d.x}-${d.x + xRangeStep}<br>
                <strong>Y Range:</strong> ${d.y}-${d.y + yRangeStep}<br>
                <strong>Count:</strong> ${d.count}<br>
                <strong>Intensity:</strong> ${d.intensity.toFixed(2)}`);
        })
        .on("mousemove", event => {
            d3.select(".tooltip")
                .style("top", `${event.pageY + 10}px`)
                .style("left", `${event.pageX + 10}px`);
        })
        .on("mouseout", function () {
            // reset opacity of all bubbles
            d3.select(this)
                .transition()
                .duration(200)
                .attr("r", d => radius(d.count))
                .style("opacity", 0.8);
    
            svg.selectAll("circle")
                .transition()
                .duration(200)
                .style("opacity", 0.8);
    
            // reset info
            updateBarInfo(null);
        });
        

    //add dynamic legend
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

// Function to update the axis dropdowns based on the selected intensity variable
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

// Function to draw a bar chart based on the selected bubble
function drawBubbleBarChart(data, containerId = "bar-chart-bubble") {
    // Clear the existing chart
    d3.select(`#${containerId}`).selectAll("*").remove();

    const containerWidth = d3.select(`#${containerId}`).node().getBoundingClientRect().width;
    const containerHeight = 500;

    const margin = { top: 40, right: 20, bottom: 80, left: 70 }, // Adjust bottom margin for labels
        width = containerWidth - margin.left - margin.right,
        height = containerHeight - margin.top - margin.bottom;

    const svg = d3.select(`#${containerId}`)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Sort data by category for proper ordering
    data.sort((a, b) => d3.ascending(a.category, b.category));

    // Define scales
    const x = d3.scaleBand()
        .range([0, width])
        .domain(data.map(d => d.category)) // Sorted categories on x-axis
        .padding(0.3);

    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.count)])
        .range([height, 0]);

    // Add axes
    const xAxis = svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x));

    // Rotate x-axis labels for better readability
    xAxis.selectAll("text")
        .attr("transform", "rotate(-45)") // Rotate labels
        .style("text-anchor", "end") // Align to the end
        .style("font-size", "12px");

    const yAxis = svg.append("g")
        .call(d3.axisLeft(y).ticks(5).tickFormat(d3.format("d"))); // Format y-axis as integers

    // Add bars
    svg.selectAll(".bar")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", d => x(d.category))
        .attr("y", d => y(d.count))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.count))
        .attr("fill", "#69b3a2");

    // Add labels above bars
    svg.selectAll(".bar-label")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "bar-label")
        .attr("x", d => x(d.category) + x.bandwidth() / 2)
        .attr("y", d => y(d.count) - 5)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text(d => d.count);

    // Add chart title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Distribution of Sleep Quality");

    // Add x-axis label
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10) // Adjusted position below x-axis
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .text("Sleep Quality"); // Replace this with the dynamic x-axis variable if needed

    // Add y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -(height / 2))
        .attr("y", -margin.left + 20) // Position to the left of the y-axis
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Number of Students");
}
