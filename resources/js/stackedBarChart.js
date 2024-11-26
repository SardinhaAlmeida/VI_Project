// stackedBarChart.js

function drawStackedBarChart(data, containerId = "chart") {
    // Limpa o contêiner
    const container = d3.select(`#${containerId}`);
    container.selectAll("*").remove();

    // Define dimensões e margens
    const margin = { top: 40, right: 150, bottom: 120, left: 70 },
        width = 800 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    // Adiciona o objeto SVG
    const svg = container
        .append("svg")
        .attr("width", width + margin.left + margin.right + 200) // Espaço extra para a legenda
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            `translate(${margin.left},${margin.top})`);

    // Lista de todas as atividades possíveis
    const allSubgroups = ["Sleep_Hours", "Screen_Time_Hours", "Technology_Usage_Hours", "Gaming_Hours", "Social_Media_Usage_Hours"];

    // Subgrupos iniciais (atividades a serem exibidas)
    let subgroups = allSubgroups.slice(); // Copia o array

    // Agrupa os dados por faixa etária e soma as atividades
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
    ).map(d => d[1]); // Extrai os objetos de resultado

    // Lista de grupos (categorias no eixo X)
    const groups = groupedData.map(d => d.Age_Group);

    // Adiciona o eixo X
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

    // Adiciona o eixo Y
    const y = d3.scaleLinear()
        .range([height, 0]);

    const yAxis = svg.append("g");

    // Paleta de cores
    const color = d3.scaleOrdinal()
        .domain(allSubgroups)
        .range(d3.schemeCategory10);

    // Cria a legenda
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("font-family", "sans-serif")
        .attr("font-size", 12)
        .attr("text-anchor", "start");

    // Função para atualizar o gráfico
    function updateChart() {
        // Empilha os dados
        const stackedData = d3.stack()
            .keys(subgroups)
            (groupedData);

        // Atualiza o domínio do eixo Y
        y.domain([0, d3.max(stackedData[stackedData.length - 1], d => d[1])]);
        yAxis.transition().call(d3.axisLeft(y));

        // Liga os dados
        const bars = svg.selectAll(".layer")
            .data(stackedData, d => d.key);

        // Remove camadas que não estão mais nos dados
        bars.exit().remove();

        // Adiciona novas camadas
        const newBars = bars.enter().append("g")
            .attr("class", "layer")
            .attr("fill", d => color(d.key));

        // Atualiza as camadas existentes
        const allBars = newBars.merge(bars);

        // Para cada camada, liga os retângulos
        const rects = allBars.selectAll("rect")
            .data(d => d, d => d.data.Age_Group);

        rects.exit().remove();

        rects.enter().append("rect")
            .attr("x", d => x(d.data.Age_Group))
            .attr("width", x.bandwidth())
            .on("mouseover", function(event, d) {
                // Mostra o tooltip
                d3.select(".tooltip")
                    .style("visibility", "visible")
                    .html(`${d3.select(this.parentNode).datum().key.replace(/_/g, ' ')}: ${(d[1] - d[0]).toFixed(2)} horas`)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY}px`);
            })
            .on("mousemove", function(event) {
                // Atualiza a posição do tooltip
                d3.select(".tooltip")
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY}px`);
            })
            .on("mouseout", function() {
                // Esconde o tooltip
                d3.select(".tooltip").style("visibility", "hidden");
            })
            .merge(rects)
            .transition()
            .attr("x", d => x(d.data.Age_Group))
            .attr("y", d => y(d[1]))
            .attr("height", d => y(d[0]) - y(d[1]))
            .attr("width", x.bandwidth());

        // Atualiza a legenda
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
                // Aumenta a opacidade das barras do subgrupo correspondente
                svg.selectAll(".layer")
                    .filter(layer => layer.key === d)
                    .selectAll("rect")
                    .transition()
                    .duration(200)
                    .style("opacity", 1); // Realça as barras do grupo
        
                // Reduz a opacidade dos outros subgrupos
                svg.selectAll(".layer")
                    .filter(layer => layer.key !== d)
                    .selectAll("rect")
                    .transition()
                    .duration(200)
                    .style("opacity", 0.3); // Suaviza os outros subgrupos
            })
            .on("mouseout", function() {
                // Restaura a opacidade de todas as barras
                svg.selectAll(".layer")
                    .selectAll("rect")
                    .transition()
                    .duration(200)
                    .style("opacity", 1);
            });

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

    // Adiciona o título do gráfico
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text("Screen, Sleep, Technology, Gaming, and Social Media Hours by Age");

    // Adiciona o rótulo do eixo X
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + 70)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Age Groups");

    // Adiciona o rótulo do eixo Y
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -50)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Total Hours");
}