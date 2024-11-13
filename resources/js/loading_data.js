const sleep_path = "resources/data/student_sleep_patterns.csv";
const mental_health_path = "resources/data/mental_health_and_technology_usage_2024.csv";


d3.csv(sleep_path).then(data => {
    // Log the full data
    console.log("Full Data:", data);

    // Example: Log the first entry for inspection
    console.log("First Entry:", data[0]);

    // Process data - convert numeric fields
    const processedData = data.map(d => ({
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

    // Log processed data
    console.log("Processed Data:", processedData);

    // Example: Analyze average sleep duration
    const avgSleepDuration = d3.mean(processedData, d => d.Sleep_Duration);
    console.log("Average Sleep Duration:", avgSleepDuration);
}).catch(error => {
    console.error("Error loading the CSV file:", error);
});


d3.csv(mental_health_path).then(data => {

    // Log the full data
    console.log("Full Data:", data);

    // Example: Log the first entry for inspection
    console.log("First Entry:", data[0]);

    // Process data - convert numeric fields
    const processedData = data.map(d => ({
        User_ID: +d.User_ID,
        Age: +d.Age,
        Gender : d.Gender,
        Technology_Usage_Hours: +d.Technology_Usage_Hours,
        Social_Media_Usage_Hours: +d.Social_Media_Usage_Hours,
        Gaming_Hours: +d.Gaming_Hours,
        Screen_Time_Hours: +d.Screen_Time_Hours,
        Mental_Health_Status : d.Mental_Health_Status,
        Stress_Level: +d.Stress_Level,
        Physical_Activity_Hours: +d.Physical_Activity_Hours,
        Support_System_Access: d.Support_System_Access,
        Work_Environment_Impact: d.Work_Environment_Impact,
        Online_Support_Usage: d.Online_Support_Usage
    }));

    // Log processed data
    console.log("Processed Data:", processedData);

    // Example: Analyze average stress level
    const avgStressLevel = d3.mean(processedData, d => d.Stress_Level);
    console.log("Average Stress Level:", avgStressLevel);
}
).catch(error => {
    console.error("Error loading the CSV file:", error);
});

