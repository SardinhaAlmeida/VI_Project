function drawBoxPlot(data) {
    //get the x and y variables
    const xVar = xSelect.value;
    const yVar = ySelect.value;

    console.log(`Drawing Box Plot with xVar: ${xVar}, yVar: ${yVar}`);

    //filter out invalid data
    const validData = data.filter(d => {
        const xValue = parseFloat(d[xVar]);
        const yValue = parseFloat(d[yVar]);
        return !isNaN(xValue) && !isNaN(yValue);
    });

    if (validData.length === 0) {
        console.error("No valid data for Box Plot.");
        d3.select("#chart").selectAll("*").remove();
        return;
    }

    d3.select("#chart").selectAll("*").remove();

    const margin = { top: 40, right: 30, bottom: 70, left: 70 };
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // add SVG
    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // verify if xVar is numeric
    const xValues = validData.map(d => +d[xVar]);
    const xIsNumeric = xValues.every(v => !isNaN(v));

    let categories;

    if (xIsNumeric) {
        // group x values into bins
        const numBins = 5; 
        const xExtent = d3.extent(xValues);
        const binGenerator = d3.bin()
            .domain(xExtent)
            .thresholds(numBins);

        const bins = binGenerator(xValues);

        // map each x value to its corresponding bin
        validData.forEach(d => {
            const xValue = +d[xVar];
            let binIndex = bins.findIndex(bin => xValue >= bin.x0 && xValue < bin.x1);
            if (binIndex === -1) binIndex = bins.length - 1; // last bin
            d.binnedX = `[${bins[binIndex].x0.toFixed(2)}, ${bins[binIndex].x1.toFixed(2)})`;
        });

        // order
        categories = Array.from(new Set(validData.map(d => d.binnedX)))
            .sort((a, b) => {
                const aStart = parseFloat(a.split(",")[0].replace("[", ""));
                const bStart = parseFloat(b.split(",")[0].replace("[", ""));
                return aStart - bStart;
            });
    } else {
        //order
        categories = Array.from(new Set(validData.map(d => d[xVar]))).sort(d3.ascending);
    }

    const xScale = d3.scaleBand()
        .domain(categories)
        .range([0, width])
        .paddingInner(0.1)
        .paddingOuter(0.1);

    const yValues = validData.map(d => +d[yVar]);
    const yMin = d3.min(yValues);
    const yMax = d3.max(yValues);

    const yScale = d3.scaleLinear()
        .domain([yMin, yMax])
        .range([height, 0]);

    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    svg.append("g").call(d3.axisLeft(yScale));

    //x-axis label
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 20)
        .attr("text-anchor", "middle")
        .style("font-weight", "bold")
        .text(xVar.replace(/_/g, ' '));

    //y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 20)
        .attr("text-anchor", "middle")
        .style("font-weight", "bold")
        .text(yVar.replace(/_/g, ' '));

    // group per category
    const groupedData = d3.rollups(
        validData,
        group => group.map(d => +d[yVar]),
        d => xIsNumeric ? d.binnedX : d[xVar]
    );

    // calculate statistics per group
    const stats = groupedData.map(([key, values]) => {
        values.sort(d3.ascending);
        const q1 = d3.quantile(values, 0.25);
        const median = d3.quantile(values, 0.5);
        const q3 = d3.quantile(values, 0.75);
        const iqr = q3 - q1;
        const min = Math.max(q1 - 1.5 * iqr, d3.min(values));
        const max = Math.min(q3 + 1.5 * iqr, d3.max(values));
        return {
            key: key,
            q1: q1,
            median: median,
            q3: q3,
            iqr: iqr,
            min: min,
            max: max,
            values: values // for individual points
        };
    });

    // vertical lines
    svg.selectAll(".vertLines")
        .data(stats)
        .enter()
        .append("line")
        .attr("x1", d => xScale(d.key) + xScale.bandwidth() / 2)
        .attr("x2", d => xScale(d.key) + xScale.bandwidth() / 2)
        .attr("y1", d => yScale(d.min))
        .attr("y2", d => yScale(d.max))
        .attr("stroke", "black");
    
    let pointTimeout;

    // draw boxes
    const boxWidth = xScale.bandwidth();
    svg.selectAll(".boxes")
        .data(stats)
        .enter()
        .append("rect")
        .attr("x", d => xScale(d.key))
        .attr("y", d => yScale(d.q3))
        .attr("height", d => yScale(d.q1) - yScale(d.q3))
        .attr("width", boxWidth)
        .attr("stroke", "black")
        .style("fill", "#69b3a2")
        .style("opacity", 0.7)
        .on("mouseover", function (event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .style("opacity", 1)
                .style("fill", "#45a3b3");

            updateBarInfo(`Box Selected:<br>
                <strong>Category:</strong> ${d.key}<br>
                <strong>Min:</strong> ${d.min}<br>
                <strong>Median:</strong> ${d.median}<br>
                <strong>Max:</strong> ${d.max}`);
        })
        .on("mouseout", function () {
            d3.select(this)
                .transition()
                .duration(200)
                .style("opacity", 0.7)
                .style("fill", "#69b3a2");

            updateBarInfo(null);
        });

    // draw median lines
    svg.selectAll(".medianLines")
        .data(stats)
        .enter()
        .append("line")
        .attr("x1", d => xScale(d.key))
        .attr("x2", d => xScale(d.key) + boxWidth)
        .attr("y1", d => yScale(d.median))
        .attr("y2", d => yScale(d.median))
        .attr("stroke", "black");

    // draw individual points with jitter
    const jitterWidth = boxWidth * 0.7;
    validData.forEach(d => {
        svg.append("circle")
            .attr("cx", () => xScale(d.binnedX || d[xVar]) + boxWidth / 2 - jitterWidth / 2 + Math.random() * jitterWidth)
            .attr("cy", yScale(+d[yVar]))
            .attr("r", 4)
            .style("fill", "white")
            .attr("stroke", "black")
            .style("opacity", 0.7)
            .on("mouseover", function () {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("r", 8)
                    .style("opacity", 1)
                    .style("stroke", "red");
    
                updateBarInfo(`
                    <strong>Individual Point:</strong><br>
                    <strong>${xVar}:</strong> ${d[xVar]}<br>
                    <strong>${yVar}:</strong> ${d[yVar]}
                `);
            })
            .on("mouseout", function () {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("r", 4)
                    .style("opacity", 0.7)
                    .style("stroke", "black");
    
                updateBarInfo(null);
            });
    });    

    // add title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text(`Box Plot with Individual Points for ${xVar} and ${yVar}`);
        
}

