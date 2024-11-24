function drawBubbleChart(data) {
    if (!data || data.length === 0) {
        console.error("No data available for bubble chart.");
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

    const xValue = "Caffeine_Intake"; // X-axis
    const yValue = "Physical_Activity"; // Y-axis
    const groupValue = "Sleep_Quality"; // Bubble grouping by Sleep Quality

    const activityRange = 20; // Physical Activity ranges in 20-minute intervals
    const groupByRange = value => Math.floor(value / activityRange) * activityRange;

    // Group data by Caffeine_Intake and ranges of Physical_Activity
    const groupedData = d3.rollup(
        data,
        v => ({
            count: v.length, // Number of students in this group
            sleepQuality: d3.mean(v, d => d[groupValue]), // Average Sleep Quality
        }),
        d => d[xValue], // Group by Caffeine Intake
        d => groupByRange(d[yValue]) // Group by ranges of Physical Activity
    );

    // Flatten grouped data for plotting
    const flattenedData = [];
    groupedData.forEach((yGroup, xValue) => {
        yGroup.forEach((value, yRange) => {
            flattenedData.push({
                x: xValue,
                y: yRange,
                count: value.count,
                sleepQuality: value.sleepQuality,
            });
        });
    });

    // Clear previous chart
    d3.select("#chart").selectAll("*").remove();

    // Dimensions
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

    // Scales
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
        .domain(d3.extent(flattenedData, d => d.sleepQuality));


    // Axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .append("text")
        .attr("y", 50)
        .attr("x", width / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "black")
        .text("Caffeine Intake");

    svg.append("g")
        .call(d3.axisLeft(y).tickFormat(d => `${d}-${d + activityRange - 1}`))
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", -50)
        .attr("x", -(height / 2))
        .attr("text-anchor", "middle")
        .attr("fill", "black")
        .text("Physical Activity (minutes)");

    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("visibility", "hidden")
        .text("Test Tooltip"); // Add a test text
    
    console.log(tooltip.node()); // Log the tooltip element
    

    // Add Bubbles
    svg.selectAll("circle")
        .data(flattenedData)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.x) + x.bandwidth() / 2)
        .attr("cy", d => y(d.y) + y.bandwidth() / 2)
        .attr("r", d => radius(d.count))
        .style("fill", d => colorScale(d.sleepQuality))
        .style("opacity", 0.8)
        .on("mouseover", (event, d) => {
            console.log("Mouseover Event:", d);
            tooltip.style("visibility", "visible")
                .html(`
                    <strong>Details:</strong><br>
                    Caffeine Intake: ${d.x}<br>
                    Physical Activity: ${d.y}-${d.y + activityRange - 1} mins<br>
                    Number of Students: ${d.count}<br>
                    Avg Sleep Quality: ${d.sleepQuality.toFixed(2)}
                `);
            console.log("Tooltip HTML updated.");
        })
        .on("mousemove", event => {
            // Get the window dimensions
            const tooltipWidth = tooltip.node().offsetWidth;
            const tooltipHeight = tooltip.node().offsetHeight;
            const pageWidth = window.innerWidth;
            const pageHeight = window.innerHeight;
        
            // Calculate tooltip position
            let left = event.pageX + 10; // Add some padding from the cursor
            let top = event.pageY + 10;
        
            // Prevent tooltip from going out of the viewport
            if (left + tooltipWidth > pageWidth) {
                left = event.pageX - tooltipWidth - 10; // Move left if overflow
            }
            if (top + tooltipHeight > pageHeight) {
                top = event.pageY - tooltipHeight - 10; // Move up if overflow
            }
        
            // Update tooltip position
            tooltip.style("top", `${top}px`)
                   .style("left", `${left}px`);
        });
        
    console.log(flattenedData); // Check if flattenedData contains the expected data


    // Legend
    const legend = svg.append("g")
        .attr("transform", `translate(${width + 20}, 0)`);

    legend.append("text")
        .attr("x", 0)
        .attr("y", 0)
        .text("Sleep Quality")
        .style("font-weight", "bold");

    const legendScale = d3.scaleLinear()
        .domain([0, 10])
        .range([0, 200]);

    const legendAxis = d3.axisRight(legendScale)
        .ticks(5);

    legend.append("g")
        .attr("transform", "translate(30, 20)")
        .call(legendAxis);

    const legendGradient = svg.append("defs")
        .append("linearGradient")
        .attr("id", "gradient")
        .attr("x1", "0%")
        .attr("y1", "100%")
        .attr("x2", "0%")
        .attr("y2", "0%");

    legendGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", d3.interpolateBlues(0));

    legendGradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", d3.interpolateBlues(1));

    legend.append("rect")
        .attr("x", 0)
        .attr("y", 20)
        .attr("width", 20)
        .attr("height", 200)
        .style("fill", "url(#gradient)");
}
