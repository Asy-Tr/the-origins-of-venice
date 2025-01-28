window.onload = () => {
    const storedData = sessionStorage.getItem('chartData');

    if (!storedData) {
        console.error('No data found in sessionStorage.');
        return;
    }


    const jsonData = JSON.parse(storedData);
    console.log('Received data:', jsonData);

    function getCategoryCount(dataObject) {
        const categoryCount = {};
        for (const category in dataObject) {
            if (Object.prototype.hasOwnProperty.call(dataObject, category)) {
                categoryCount[category] = dataObject[category].length;
            }
        }
        return categoryCount;
    }


    const categoryCount = getCategoryCount(jsonData);

    const sortedData = Object.keys(categoryCount)
        .map((category) => ({category, count: categoryCount[category]}))
        .sort((a, b) => b.count - a.count);

    const ctx = document.getElementById('chart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedData.map((item) => item.category),
            datasets: [
                {
                    label: 'Count',
                    data: sortedData.map((item) => item.count),
                    backgroundColor: 'rgba(48, 63, 159, 0.2)',
                    borderColor: 'rgba(48, 63, 159, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
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

