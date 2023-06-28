const blob = document.getElementById("blob");
const tempBox = document.querySelector("#temperature");
const moistureBox = document.querySelector("#moisture");
const waterTimeBox = document.querySelector("#wateringTime");

let myChart;

function generateColor(value, min, max) {
    let percentage = (value - min) / (max - min);
    if (percentage < 0.5) {
        return `rgba(${Math.round(255 * (0.5 - percentage) * 2)}, ${Math.round(255 * percentage * 2)}, 0, 0.6)`;
    } else {
        return `rgba(0, ${Math.round(255 * (1 - percentage) * 2)}, ${Math.round(255 * (percentage - 0.5) * 2)}, 0.6)`;
    }
}

function updateValue(box, value, min, max) {
    box.querySelector("p").innerText = value;
    box.style.background = generateColor(value, min, max);
}

function initChart() {
    let ctx = document.querySelector("#chart").getContext('2d');
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Moisture',
                    data: [],
                    borderColor: 'rgb(0, 0, 255)',
                    fill: false
                },
                {
                    label: 'Temperature',
                    data: [],
                    borderColor: 'rgb(255, 255, 0)',
                    fill: false
                }
            ]
        },
        options: {
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day'
                    }
                },
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

initChart();

let demoTemperature = 20;
let demoMoisture = 2000;

setInterval(() => {
    let now = new Date();
    updateValue(tempBox, Math.round(demoTemperature), 12.5, 30);
    updateValue(moistureBox, inputMoistureToOutuptMoisture(demoMoisture), 0, 100);
    updateValue(waterTimeBox, calculateTimeUntilWatering(demoMoisture), 0, 15);

    myChart.data.labels.push(now);
    myChart.data.datasets[0].data.push(inputMoistureToOutuptMoisture(demoMoisture));
    myChart.data.datasets[1].data.push(demoTemperature);
    myChart.update();

    demoTemperature += Math.random() * 2 - 1;
    demoMoisture -= Math.random() * 100;
}, 1000);

function calculateTimeUntilWatering(moisture) {
    moisture = inputMoistureToOutuptMoisture(moisture);
    return Math.round(Math.max(
        0,
        2 ** ( (1/25) * moisture) - 1.25
    ));
}

function inputMoistureToOutuptMoisture(moisture) {
    return Math.max(0, Math.round((moisture / 2_000) * 100));
}

document.onmousemove = function(e) {
    document.body.style.backgroundPosition = `${(e.pageX - window.innerWidth / 2) * 0.1}% ${(e.pageY - window.innerHeight / 2) * 0.1}%`;
}

window.onpointermove = event => { 
    const { clientX, clientY } = event;
  
    blob.animate({
        left: `${clientX}px`,
        top: `${clientY}px`
    }, { duration: 2_000, fill: "forwards" });
}
