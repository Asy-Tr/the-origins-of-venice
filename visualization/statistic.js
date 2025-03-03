window.onload = () => {
    const chartData = sessionStorage.getItem('chartData');
    if (!chartData) {
        console.error('No data found in sessionStorage.');
        return;
    }

    const jsonChartData = JSON.parse(chartData);

    const Counter = {};
    for (const key in jsonChartData) {
        if (Object.prototype.hasOwnProperty.call(jsonChartData, key)) {
            Counter[key] = jsonChartData[key].length;
        }
    }

    const sortedData = Object.keys(Counter)
        .map((key) => ({key, count: Counter[key]}))
        .sort((a, b) => b.count - a.count);

    const context = document.getElementById('chart').getContext('2d');
    new Chart(context, {
        type: 'bar',
        data: {
            labels: sortedData.map((item) => item.key),
            datasets: [
                {
                    data: sortedData.map((item) => item.count),
                    backgroundColor: 'rgba(63, 81, 181, 0.4)',
                }
            ]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
};

