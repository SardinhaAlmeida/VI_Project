const sleep_path = "resources/data/student_sleep_patterns.csv";
const mental_health_path = "resources/data/mental_health_and_technology_usage_2024.csv";

let processedData;
let currentChart = "bar"; 
let currentDataset = "students"; 
let selectedGender = "All";
let selectedYear = "all";
let currentSort = { sortBy: "x", order: "asc" }; 

const variables = ["Sleep_Duration", "Study_Hours", "Screen_Time", "Caffeine_Intake", "Physical_Activity", "Sleep_Quality"];
const xSelect = document.getElementById("x-axis-select");
const ySelect = document.getElementById("y-axis-select");

// Populate dropdowns for X and Y axis
variables.forEach(variable => {
    let optionX = document.createElement("option");
    optionX.value = variable;
    optionX.textContent = variable.replace("_", " ");
    xSelect.appendChild(optionX);

    let optionY = document.createElement("option");
    optionY.value = variable;
    optionY.textContent = variable.replace("_", " ");
    ySelect.appendChild(optionY);
});

// Event listeners for selecting dataset
document.getElementById("students-dataset").addEventListener("click", (event) => {
    event.preventDefault(); // Prevent the default action like page going to the top
    currentDataset = "students";
    loadData(sleep_path, "Students' Sleep Quality"); 
});

// Event listener for Non Students Dataset
document.getElementById("not-students-dataset").addEventListener("click", (event) => {
    event.preventDefault();
    currentDataset = "not-students";
    loadData(mental_health_path, "Non Students' Data");
});


// FUTURA IMPLEMENTAÇÃO
document.getElementById("combined-dataset").addEventListener("click", (event) => {
    event.preventDefault(); // Prevent the default action like page going to the top
    currentDataset = "combined";
    alert("Combined dataset feature coming soon!"); 
});

// Event listeners for selecting chart type
document.getElementById("bar-chart").addEventListener("click", (event) => {
    event.preventDefault(); // Prevent the default action like page going to the top
    currentChart = "bar";
    updateControlsForCurrentChart();
    if (processedData) {
        applyCurrentFilters(); 
    }
});

document.getElementById("scatter-plot").addEventListener("click", (event) => {
    event.preventDefault(); // Prevent the default action like page going to the top
    currentChart = "scatter";
    updateControlsForCurrentChart();
    if (processedData) {
        applyCurrentFilters(); 
    }
});

// Listeners para selecionar o tipo de gráfico
document.getElementById("bubble-chart").addEventListener("click", (event) => {
    event.preventDefault(); // Prevent the default action like page going to the top
    currentChart = "bubble";
    updateControlsForCurrentChart();
    if (processedData) {
        applyCurrentFilters();
    }
});

document.getElementById("box-plot").addEventListener("click", (event) => {
    event.preventDefault(); // Prevent the default action like page going to the top
    currentChart = "box";
    updateControlsForCurrentChart();
    if (processedData) {
        applyCurrentFilters();
    }
});


// Event listeners for axis changes
xSelect.addEventListener("change", () => {
    applyCurrentFilters();
});

ySelect.addEventListener("change", () => {
    applyCurrentFilters();
});

// Event listeners for filter changes
document.getElementById("filter-male").addEventListener("click", (event) => {
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

// Event listeners for sorting (only for bar chart)
document.getElementById("sort-x-asc").addEventListener("click", () => {
    currentSort = { sortBy: "x", order: "asc" };
    applyCurrentFilters(); 
});

document.getElementById("sort-x-desc").addEventListener("click", () => {
    currentSort = { sortBy: "x", order: "desc" };
    applyCurrentFilters(); 
});


/* document.getElementById("sort-y-asc").addEventListener("click", () => {
    currentSort = { sortBy: "y", order: "asc" };
    applyCurrentFilters(); 
});

document.getElementById("sort-y-desc").addEventListener("click", () => {
    currentSort = { sortBy: "y", order: "desc" };
    applyCurrentFilters(); 
}); */

function setActiveFilter(button) {
    // Remove active class from all buttons
    document.querySelectorAll(".btn-group .btn").forEach(btn => btn.classList.remove("active-filter"));
    // Add active class to the clicked button
    button.classList.add("active-filter");
  }  

// Function to apply filters and update the chart
function applyCurrentFilters() {
    if (!processedData) return;

    let filteredData = processedData;

    // Filter by Gender
    if (selectedGender !== "All") {
        filteredData = filteredData.filter(d => d.Gender === selectedGender);
    }

    // Filter by Year
    if (selectedYear !== "all") {
        filteredData = filteredData.filter(d => d.University_Year === selectedYear);
    }

    if (currentChart === "bar") {
    // Group and sort data for the bar chart
        const groupedData = groupData(filteredData); // Group filtered data
        const sortedData = sortData(groupedData, currentSort.sortBy, currentSort.order);        
        drawBarChart(sortedData); 
        console.log("here" + sortedData);
    } else if (currentChart === "scatter") {
        drawScatterPlot(processedData); 
    } else if (currentChart === "bubble"){
        drawBubbleChart(filteredData);
    }
    else if (currentChart === "box"){
        drawBoxPlot(filteredData);
    }
}

// Function to load and process the data
function loadData(path, title) {
    d3.csv(path)
        .then(data => {
            processedData = processDataset(data);
            console.log("Processed Data:", processedData);
            document.getElementById("page-title").textContent = title;

            // Limpar o contêiner do gráfico
            document.getElementById("chart").innerHTML = "";
            document.getElementById("bar-chart-container").style.display = "none"; // Ocultar se estiver visível

            if (currentDataset === "not-students") {
                // Ocultar controles não relevantes
                document.getElementById("controls").style.display = "none";
                // Mostrar controles de atividades
                document.getElementById("activity-controls").style.display = "block";
                // Chamar o gráfico de barras empilhadas
                drawStackedBarChart(processedData);
            } else {
                // Mostrar controles
                document.getElementById("controls").style.display = "block";
                // Ocultar controles de atividades
                document.getElementById("activity-controls").style.display = "none";
                // Aplicar filtros e desenhar o gráfico padrão
                applyCurrentFilters();
            }
        }).catch(error => console.error("Error loading the CSV file:", error));
}

// Function to update controls based on current chart type
function updateControlsForCurrentChart() {
    const axisControls = document.getElementById("axis-controls");
    const yLabel = document.getElementById("y-label");
    const ySelect = document.getElementById("y-axis-select");
    const sortControls = document.getElementById("sort-controls");
    const colorControls = document.getElementById("color-controls");

    if (currentChart === "bar") {
        // axisControls.style.display = "block"; // Show axis controls
        ySelect.style.display = "none";
        sortControls.style.display = "block"; // Show sorting options
    } else if (currentChart === "scatter") {
        axisControls.style.display = "block"; // Show axis controls
        ySelect.style.display = "block";
        sortControls.style.display = "none"; // Hide sorting options
    }
}

// Function to process the dataset
function processDataset(data) {
    if (currentDataset === "students") {
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
    } else if (currentDataset === "not-students") {
        return data.map(d => {
            const age = +d.Age;
            let ageGroup;
            if (age >= 18 && age <= 24) ageGroup = '18-24';
            else if (age >= 25 && age <= 34) ageGroup = '25-34';
            else if (age >= 35 && age <= 44) ageGroup = '35-44';
            else if (age >= 45 && age <= 54) ageGroup = '45-54';
            else if (age >= 55 && age <= 64) ageGroup = '55-64';
            else ageGroup = '65+';

            return {
                User_ID: d.User_ID,
                Age: age,
                Age_Group: ageGroup,
                Gender: d.Gender,
                Technology_Usage_Hours: +d.Technology_Usage_Hours,
                Social_Media_Usage_Hours: +d.Social_Media_Usage_Hours,
                Gaming_Hours: +d.Gaming_Hours,
                Screen_Time_Hours: +d.Screen_Time_Hours,
                Mental_Health_Status: d.Mental_Health_Status,
                Stress_Level: d.Stress_Level,
                Sleep_Hours: +d.Sleep_Hours,
                Physical_Activity_Hours: +d.Physical_Activity_Hours,
                Support_Systems_Access: d.Support_Systems_Access,
                Work_Environment_Impact: d.Work_Environment_Impact,
                Online_Support_Usage: d.Online_Support_Usage
            };
        });
    }
}

// Initialize with the default dataset
loadData(sleep_path, "Students' Sleep Quality");
