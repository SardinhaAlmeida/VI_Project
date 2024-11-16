const sleep_path = "resources/data/student_sleep_patterns.csv";

let processedData; // Variável global para armazenar os dados processados

d3.csv(sleep_path).then(data => {
    processedData = data.map(d => ({
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

    console.log("Processed Data:", processedData);
    console.log(`Total number of entries: ${processedData.length}`);

    // Chama a função inicial com os dados completos
    drawInitialChart(processedData);

    // Configura os botões após a carga inicial
    configureFilterButtons();
    configureSortButtons();
}).catch(error => {
    console.error("Error loading the CSV file:", error);
});