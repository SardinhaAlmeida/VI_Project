function drawBoxPlot(data) {
    console.log("Initial Data for Box Plot:", data);

    const validData = data.filter(d => {
        const sleepHours = parseFloat(d.Sleep_Duration);
        const caffeineIntake = parseFloat(d.Caffeine_Intake);
        const isValid = !isNaN(sleepHours) && !isNaN(caffeineIntake);
        return isValid; // Retorna true apenas para dados válidos
    });

    if (validData.length === 0) {
        console.error("No valid data for Box Plot.");
        d3.select("#chart").selectAll("*").remove(); 
        return;
    }

    // Clear previous chart
    d3.select("#chart").selectAll("*").remove();

    // Chart dimensions
    const margin = { top: 10, right: 30, bottom: 70, left: 50 };
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // Append SVG
    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const categories = Array.from(new Set(validData.map(d => d.Caffeine_Intake)));
    const xScale = d3.scaleBand()
        .domain(categories)
        .range([0, width])
        .paddingInner(1)
        .paddingOuter(0.5);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(validData, d => d.Sleep_Duration)])
        .range([height, 0]);

    // Axes
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    svg.append("g").call(d3.axisLeft(yScale));

    // Axis labels
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .attr("text-anchor", "middle")
        .style("font-weight", "bold")
        .text("Caffeine Intake");

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 10)
        .attr("text-anchor", "middle")
        .style("font-weight", "bold")
        .text("Sleep Duration (hours)");

    // Calculate statistics
    const stats = d3.rollups(
        validData,
        group => {
            const sorted = group.map(d => d.Sleep_Duration).sort(d3.ascending);
            const q1 = d3.quantile(sorted, 0.25);
            const median = d3.quantile(sorted, 0.5);
            const q3 = d3.quantile(sorted, 0.75);
            const iqr = q3 - q1;
            const min = Math.max(q1 - 1.5 * iqr, d3.min(sorted));
            const max = Math.min(q3 + 1.5 * iqr, d3.max(sorted));
            return { q1, median, q3, iqr, min, max };
        },
        d => d.Caffeine_Intake
    );

    // Draw vertical lines
    svg.selectAll("vertLines")
        .data(stats)
        .enter()
        .append("line")
        .attr("x1", d => xScale(d[0]))
        .attr("x2", d => xScale(d[0]))
        .attr("y1", d => yScale(d[1].min))
        .attr("y2", d => yScale(d[1].max))
        .attr("stroke", "black");

    // Draw boxes
    const boxWidth = 50;
    svg.selectAll("boxes")
        .data(stats)
        .enter()
        .append("rect")
        .attr("x", d => xScale(d[0]) - boxWidth / 2)
        .attr("y", d => yScale(d[1].q3))
        .attr("height", d => yScale(d[1].q1) - yScale(d[1].q3))
        .attr("width", boxWidth)
        .attr("stroke", "black")
        .style("fill", "#69b3a2");

    // Draw median lines
    svg.selectAll("medianLines")
        .data(stats)
        .enter()
        .append("line")
        .attr("x1", d => xScale(d[0]) - boxWidth / 2)
        .attr("x2", d => xScale(d[0]) + boxWidth / 2)
        .attr("y1", d => yScale(d[1].median))
        .attr("y2", d => yScale(d[1].median))
        .attr("stroke", "black");

    // Add jitter points
    const jitterWidth = 20;
    const points = svg.selectAll("indPoints")
        .data(validData)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d.Caffeine_Intake) - jitterWidth / 2 + Math.random() * jitterWidth)
        .attr("cy", d => yScale(d.Sleep_Duration))
        .attr("r", 4)
        .style("fill", "white")
        .attr("stroke", "black")
        .style("opacity", 0.7)
        .on("mouseover", function (event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .attr("r", 6)
                .style("opacity", 1);

            // Show tooltip
            d3.select(".tooltip")
                .style("visibility", "visible")
                .html(`
                    <strong>Details:</strong><br>
                    Caffeine Intake: ${d.Caffeine_Intake}<br>
                    Sleep Duration: ${d.Sleep_Duration}
                `);
        })
        .on("mousemove", event => {
            d3.select(".tooltip")
                .style("top", `${event.pageY + 10}px`)
                .style("left", `${event.pageX + 10}px`);
        })
        .on("mouseout", function () {
            d3.select(this)
                .transition()
                .duration(200)
                .attr("r", 4)
                .style("opacity", 0.7);

            // Hide tooltip
            d3.select(".tooltip").style("visibility", "hidden");
        });
}
