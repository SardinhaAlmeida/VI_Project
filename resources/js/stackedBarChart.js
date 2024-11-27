function drawStackedBarChart(data, containerId = "chart") {

    const container = d3.select(`#${containerId}`);
    container.selectAll("*").remove();

    const margin = { top: 40, right: 150, bottom: 120, left: 70 },
        width = 800 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    const svg = container
        .append("svg")
        .attr("width", width + margin.left + margin.right + 200)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            `translate(${margin.left},${margin.top})`);

    //variables
    const allSubgroups = ["Sleep_Hours", "Screen_Time_Hours", "Technology_Usage_Hours", "Gaming_Hours", "Social_Media_Usage_Hours"];

    //subgroups
    let subgroups = allSubgroups.slice();

    //group per age group and sum the values
    const groupedData = d3.rollups(
        data,
        v => {
            const result = { 
                Age_Group: v[0].Age_Group,
            };
            allSubgroups.forEach(k => {
                result[k] = d3.sum(v, d => d[k]);
            });
            return result;
        },
        d => d.Age_Group
    ).map(d => d[1]);

    //groups list (categorys in x-axis)
    const groups = groupedData.map(d => d.Age_Group);

    const x = d3.scaleBand()
        .domain(groups)
        .range([0, width])
        .padding([0.2]);

    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x).tickSizeOuter(0))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    const y = d3.scaleLinear()
        .range([height, 0]);

    const yAxis = svg.append("g");

    //color palette
    const color = d3.scaleOrdinal()
        .domain(allSubgroups)
        .range(d3.schemeCategory10);

    // add legend
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("font-family", "sans-serif")
        .attr("font-size", 12)
        .attr("text-anchor", "start");

    // Function to update the chart
    function updateChart() {
        //Stack the data
        const stackedData = d3.stack()
            .keys(subgroups)
            (groupedData);

        // Update the y-axis domain
        y.domain([0, d3.max(stackedData[stackedData.length - 1], d => d[1])]);
        yAxis.transition().call(d3.axisLeft(y));

        // Join the data
        const bars = svg.selectAll(".layer")
            .data(stackedData, d => d.key);

        // remove old bars
        bars.exit().remove();

        // add new bars
        const newBars = bars.enter().append("g")
            .attr("class", "layer")
            .attr("fill", d => color(d.key));

        // update all bars
        const allBars = newBars.merge(bars);

        // for each subgroup, connect the rectangles
        const rects = allBars.selectAll("rect")
            .data(d => d, d => d.data.Age_Group);

        rects.exit().remove();

        rects.enter().append("rect")
            .attr("x", d => x(d.data.Age_Group))
            .attr("width", x.bandwidth())
            .on("mouseover", function(event, d) {
                //rooltip and logs
                const subgroup = d3.select(this.parentNode).datum().key.replace(/_/g, ' ');
                const value = (d[1] - d[0]).toFixed(2);
                const group = d.data.Age_Group;
        
                console.log(`Mouse over: Subgroup=${subgroup}, Group=${group}, Value=${value}`);
        
                // trying tooltip
                d3.select(".tooltip")
                    .style("visibility", "visible")
                    .html(`
                        <strong>Age Group:</strong> ${group}<br>
                        <strong>Activity:</strong> ${subgroup}<br>
                        <strong>Hours:</strong> ${value} hrs
                    `)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY}px`);
        
                // update info
                updateBarInfo(`
                    <strong>Age Group:</strong> ${group}<br>
                    <strong>Activity:</strong> ${subgroup}<br>
                    <strong>Hours:</strong> ${value} hrs
                `);
        
                console.log(`Hovered Activity: ${subgroup}, Hours: ${value}`);//debug
            })
            .on("mouseout", function() {
                // hide tooltip and clean info
                d3.select(".tooltip").style("visibility", "hidden");
                updateBarInfo(null);

                console.log("Mouse out of bar");//debug
            })
            .merge(rects)
            .transition()
            .attr("x", d => x(d.data.Age_Group))
            .attr("y", d => y(d[1]))
            .attr("height", d => y(d[0]) - y(d[1]))
            .attr("width", x.bandwidth());

        // update legend
        const legendItems = legend.selectAll("g")
            .data(subgroups.slice().reverse(), d => d);

        legendItems.exit().remove();

        const newLegendItems = legendItems.enter().append("g")
            .attr("transform", (d, i) => `translate(${width + 20},${i * 20})`);

        newLegendItems.append("rect")
            .attr("x", 0)
            .attr("width", 19)
            .attr("height", 19)
            .attr("fill", d => color(d))
            .on("mouseover", function(event, d) {
                // more opacity to the current subgroup
                svg.selectAll(".layer")
                    .filter(layer => layer.key === d)
                    .selectAll("rect")
                    .transition()
                    .duration(200)
                    .style("opacity", 1); //highlight the current subgroup
        
                // reduce opacity of the other subgroups
                svg.selectAll(".layer")
                    .filter(layer => layer.key !== d)
                    .selectAll("rect")
                    .transition()
                    .duration(200)
                    .style("opacity", 0.3);
            })
            .on("mouseout", function() {
                // reset opacity of all subgroups
                svg.selectAll(".layer")
                    .selectAll("rect")
                    .transition()
                    .duration(200)
                    .style("opacity", 1);
            });

        // add text to the legend
        newLegendItems.append("text")
            .attr("x", 24)
            .attr("y", 9.5)
            .attr("dy", "0.32em")
            .text(d => d.replace(/_/g, ' '));

        legendItems.merge(newLegendItems);
    }

    updateChart();

    // Event listeners para as checkboxes
    d3.selectAll(".activity-checkbox").on("change", function() {
        const checkedActivities = [];
        d3.selectAll(".activity-checkbox").each(function() {
            const cb = d3.select(this);
            if (cb.property("checked")) {
                checkedActivities.push(cb.property("value"));
            }
        });
        subgroups = checkedActivities;
        updateChart();
    });

    // add graph title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text("Screen, Sleep, Technology, Gaming, and Social Media Hours by Age");

    // x-axis label
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 70)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Age Groups");

    // y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -50)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Total Hours");
}
