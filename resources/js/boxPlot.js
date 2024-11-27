/* // boxPlot.js

function drawBoxPlot(data) {
    // Obter as variáveis selecionadas
    const xVar = xSelect.value;
    const yVar = ySelect.value;

    console.log(`Drawing Box Plot with xVar: ${xVar}, yVar: ${yVar}`);

    // Filtrar dados válidos
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

    // Limpar gráfico anterior
    d3.select("#chart").selectAll("*").remove();

    // Dimensões do gráfico
    const margin = { top: 40, right: 30, bottom: 70, left: 70 };
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // Adicionar SVG
    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Verificar se a variável X é numérica
    const xValues = validData.map(d => +d[xVar]);
    const xIsNumeric = xValues.every(v => !isNaN(v));

    let categories;

    if (xIsNumeric) {
        // Agrupar variável X em bins e ordenar
        const numBins = 5; // Ajustar o número de bins conforme necessário
        const xExtent = d3.extent(xValues);
        const binGenerator = d3.bin()
            .domain(xExtent)
            .thresholds(numBins);
    
        const bins = binGenerator(xValues);
    
        // Mapear dados para bins
        validData.forEach(d => {
            const xValue = +d[xVar];
            let binIndex = bins.findIndex(bin => xValue >= bin.x0 && xValue < bin.x1);
            if (binIndex === -1) binIndex = bins.length - 1; // Último bin
            d.binnedX = `[${bins[binIndex].x0.toFixed(2)}, ${bins[binIndex].x1.toFixed(2)})`;
        });
    
        // Ordenar categorias numericamente
        categories = Array.from(new Set(validData.map(d => d.binnedX)))
            .sort((a, b) => {
                const aStart = parseFloat(a.split(",")[0].replace("[", ""));
                const bStart = parseFloat(b.split(",")[0].replace("[", ""));
                return aStart - bStart;
            });
    } else {
        // Ordenar valores categóricos em ordem alfabética (ou qualquer ordem desejada)
        categories = Array.from(new Set(validData.map(d => d[xVar]))).sort(d3.ascending);
    }
    

    // Escalas
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

    // Eixos
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    svg.append("g").call(d3.axisLeft(yScale));

    // Rótulos dos eixos
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 20)
        .attr("text-anchor", "middle")
        .style("font-weight", "bold")
        .text(xVar.replace(/_/g, ' '));

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 20)
        .attr("text-anchor", "middle")
        .style("font-weight", "bold")
        .text(yVar.replace(/_/g, ' '));

    // Agrupar dados por categorias
    const groupedData = d3.rollups(
        validData,
        group => group.map(d => +d[yVar]),
        d => xIsNumeric ? d.binnedX : d[xVar]
    );

    // Calcular estatísticas para cada grupo
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
            values: values // Para plotar os pontos individuais
        };
    });

    // Desenhar linhas verticais
    svg.selectAll(".vertLines")
        .data(stats)
        .enter()
        .append("line")
        .attr("x1", d => xScale(d.key) + xScale.bandwidth() / 2)
        .attr("x2", d => xScale(d.key) + xScale.bandwidth() / 2)
        .attr("y1", d => yScale(d.min))
        .attr("y2", d => yScale(d.max))
        .attr("stroke", "black")
        .style("width", 40);

    // Desenhar caixas
    const boxWidth = xScale.bandwidth();
    svg.selectAll(".boxes")
        .data(stats)
        .enter()
        .append("rect")
        .merge(svg.selectAll(".boxes"))
        .transition()
        .duration(750)
        .attr("x", d => xScale(d.key))
        .attr("x", d => xScale(d.key))
        .attr("y", d => yScale(d.q3))
        .attr("height", d => yScale(d.q1) - yScale(d.q3))
        .attr("width", boxWidth)
        .attr("stroke", "black")
        .style("fill", "#69b3a2")
        .style("opacity", 0.7);

    // Desenhar linhas medianas
    svg.selectAll(".medianLines")
        .data(stats)
        .enter()
        .append("line")
        .attr("x1", d => xScale(d.key))
        .attr("x2", d => xScale(d.key) + boxWidth)
        .attr("y1", d => yScale(d.median))
        .attr("y2", d => yScale(d.median))
        .attr("stroke", "black")
        .style("width", 80);

    // Adicionar pontos individuais com jitter
    const jitterWidth = boxWidth * 0.5;
    stats.forEach(d => {
        svg.selectAll(`.indPoints-${d.key}`)
            .data(d.values)
            .enter()
            .append("circle")
            .attr("cx", () => xScale(d.key) + boxWidth / 2 - jitterWidth / 2 + Math.random() * jitterWidth)
            .attr("cy", v => yScale(v))
            .attr("r", 3)
            .style("fill", "white")
            .attr("stroke", "black")
            .style("opacity", 0.7)
            .on("mouseover", function (event, value) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr("r", 5)
                    .style("opacity", 1);

                // Mostrar tooltip
                d3.select(".tooltip")
                    .style("visibility", "visible")
                    .html(`
                        <strong>Details:</strong><br>
                        ${xVar.replace(/_/g, ' ')}: ${d.key}<br>
                        ${yVar.replace(/_/g, ' ')}: ${value}
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
                    .attr("r", 3)
                    .style("opacity", 0.7);

                // Esconder tooltip
                d3.select(".tooltip").style("visibility", "hidden");
            });
    });

    // Adicionar título ao gráfico
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text(`Relationship Between ${xVar.replace(/_/g, ' ')} and ${yVar.replace(/_/g, ' ')}`);
}
 */

function drawBoxPlot(data) {
    // Obter as variáveis selecionadas
    const xVar = xSelect.value;
    const yVar = ySelect.value;

    console.log(`Drawing Box Plot with xVar: ${xVar}, yVar: ${yVar}`);

    // Filtrar dados válidos
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

    // Limpar gráfico anterior
    d3.select("#chart").selectAll("*").remove();

    // Dimensões do gráfico
    const margin = { top: 40, right: 30, bottom: 70, left: 70 };
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // Adicionar SVG
    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Verificar se a variável X é numérica
    const xValues = validData.map(d => +d[xVar]);
    const xIsNumeric = xValues.every(v => !isNaN(v));

    let categories;

    if (xIsNumeric) {
        // Agrupar variável X em bins e ordenar
        const numBins = 5; // Ajustar o número de bins conforme necessário
        const xExtent = d3.extent(xValues);
        const binGenerator = d3.bin()
            .domain(xExtent)
            .thresholds(numBins);

        const bins = binGenerator(xValues);

        // Mapear dados para bins
        validData.forEach(d => {
            const xValue = +d[xVar];
            let binIndex = bins.findIndex(bin => xValue >= bin.x0 && xValue < bin.x1);
            if (binIndex === -1) binIndex = bins.length - 1; // Último bin
            d.binnedX = `[${bins[binIndex].x0.toFixed(2)}, ${bins[binIndex].x1.toFixed(2)})`;
        });

        // Ordenar categorias numericamente
        categories = Array.from(new Set(validData.map(d => d.binnedX)))
            .sort((a, b) => {
                const aStart = parseFloat(a.split(",")[0].replace("[", ""));
                const bStart = parseFloat(b.split(",")[0].replace("[", ""));
                return aStart - bStart;
            });
    } else {
        // Ordenar valores categóricos em ordem alfabética
        categories = Array.from(new Set(validData.map(d => d[xVar]))).sort(d3.ascending);
    }

    // Escalas
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

    // Eixos
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    svg.append("g").call(d3.axisLeft(yScale));

    // Rótulos dos eixos
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 20)
        .attr("text-anchor", "middle")
        .style("font-weight", "bold")
        .text(xVar.replace(/_/g, ' '));

    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 20)
        .attr("text-anchor", "middle")
        .style("font-weight", "bold")
        .text(yVar.replace(/_/g, ' '));

    // Agrupar dados por categorias
    const groupedData = d3.rollups(
        validData,
        group => group.map(d => +d[yVar]),
        d => xIsNumeric ? d.binnedX : d[xVar]
    );

    // Calcular estatísticas para cada grupo
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
            values: values // Para plotar os pontos individuais
        };
    });

    // Desenhar linhas verticais
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

    // Desenhar caixas
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

    // Desenhar linhas medianas
    svg.selectAll(".medianLines")
        .data(stats)
        .enter()
        .append("line")
        .attr("x1", d => xScale(d.key))
        .attr("x2", d => xScale(d.key) + boxWidth)
        .attr("y1", d => yScale(d.median))
        .attr("y2", d => yScale(d.median))
        .attr("stroke", "black");

    // Adicionar pontos individuais com jitter
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

    // Adicionar título ao gráfico
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text(`Box Plot with Individual Points for ${xVar} and ${yVar}`);
        
}

