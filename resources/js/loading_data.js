const sleep_path = "resources/data/student_sleep_patterns.csv";
const mental_health_path = "resources/data/mental_health_and_technology_usage_2024.csv";

let processedData;
let currentChart = "bar"; // "bar" ou "scatter"
let currentDataset = "students"; // "students", "not-students" ou "combined"
let selectedGender = "All";
let selectedYear = "all";
let currentSort = { sortBy: "x", order: "asc" }; // Adicionado para controlar a ordenação

// Event listeners para seleção de dataset
document.getElementById("students-dataset").addEventListener("click", () => {
    currentDataset = "students";
    loadData(sleep_path, "Students' Sleep Quality");
});
document.getElementById("not-students-dataset").addEventListener("click", () => {
    currentDataset = "not-students";
    loadData(mental_health_path, "Not Students' Data");
});
document.getElementById("combined-dataset").addEventListener("click", () => {
    currentDataset = "combined";
    alert("Combined dataset feature coming soon!");
});

// Event listeners para seleção do tipo de gráfico
document.getElementById("bar-chart").addEventListener("click", () => {
    currentChart = "bar";
    updateControlsForCurrentChart();
    drawInitialChart(processedData);
});

document.getElementById("scatter-plot").addEventListener("click", () => {
    currentChart = "scatter";
    updateControlsForCurrentChart();
    drawScatterPlot(processedData);
});

// Atualiza o gráfico atual com os dados filtrados
function applyCurrentFilters() {
    if (!processedData) return;

    let filteredData = processedData;

    if (selectedGender !== "All") {
        filteredData = filteredData.filter(d => d.Gender === selectedGender);
        console.log("After Gender Filter:", filteredData);
    }

    if (selectedYear !== "all") {
        filteredData = filteredData.filter(d => d.University_Year == selectedYear);
        console.log("After Year Filter:", filteredData);
    }

    if (currentChart === "bar") {
        applyFiltersAndSort(filteredData);
    } else if (currentChart === "scatter") {
        drawScatterPlot(filteredData);
    }
}


// Configura filtros para atualizar o gráfico atual
document.getElementById("filter-male").addEventListener("click", () => {
    selectedGender = "Male";
    applyCurrentFilters();
});

document.getElementById("filter-female").addEventListener("click", () => {
    selectedGender = "Female";
    applyCurrentFilters();
});

document.getElementById("filter-other").addEventListener("click", () => {
    selectedGender = "Other";
    applyCurrentFilters();
});

document.getElementById("filter-all").addEventListener("click", () => {
    selectedGender = "All";
    applyCurrentFilters();
});

document.getElementById("filter-year").addEventListener("change", function () {
    selectedYear = this.value;
    applyCurrentFilters();
});

// Event listeners para ordenação (aplicável apenas ao gráfico de barras)
document.getElementById("sort-x-asc").addEventListener("click", () => {
    currentSort = { sortBy: "x", order: "asc" };
    applyCurrentFilters();
});

document.getElementById("sort-x-desc").addEventListener("click", () => {
    currentSort = { sortBy: "x", order: "desc" };
    applyCurrentFilters();
});

document.getElementById("sort-y-asc").addEventListener("click", () => {
    currentSort = { sortBy: "y", order: "asc" };
    applyCurrentFilters();
});

document.getElementById("sort-y-desc").addEventListener("click", () => {
    currentSort = { sortBy: "y", order: "desc" };
    applyCurrentFilters();
});

// Função para carregar e processar os dados
function loadData(path, title) {
    d3.csv(path).then(data => {
        processedData = processDataset(data);
        console.log("Processed Data:", processedData); // Log dos dados carregados
        document.getElementById("page-title").textContent = title;
        applyCurrentFilters(); // Redesenha o gráfico ativo
    }).catch(error => console.error("Error loading the CSV file:", error));
}

function updateControlsForCurrentChart() {
    const axisControls = document.getElementById("axis-controls");
    const sortControls = document.getElementById("sort-controls");

    if (currentChart === "bar") {
        axisControls.style.display = "none"; // O gráfico de barras não usa seletores de eixo
        sortControls.style.display = "block";
    } else if (currentChart === "scatter") {
        axisControls.style.display = "block";
        sortControls.style.display = "none"; // Ordenação não se aplica ao scatter plot
    }
}

function processDataset(data) {
    return data.map(d => ({
        Student_ID: +d.Student_ID,
        Age: +d.Age,
        Gender: d.Gender,
        University_Year: d.University_Year,
        Sleep_Duration: +d.Sleep_Duration,
        Study_Hours: +d.Study_Hours,
        Screen_Time: +d.Screen_Time,
        Caffeine_Intake: +d.Caffeine_Intake,
        Physical_Activity: +d.Physical_Activity,
        Sleep_Quality: +d.Sleep_Quality,
        Weekday_Sleep_Start: +d.Weekday_Sleep_Start,
        Weekend_Sleep_Start: +d.Weekend_Sleep_Start,
        Weekday_Sleep_End: +d.Weekday_Sleep_End,
        Weekend_Sleep_End: +d.Weekend_Sleep_End
    }));
}

// Inicializa com o dataset padrão
loadData(sleep_path, "Students' Sleep Quality");
