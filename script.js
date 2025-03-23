class PlateletCalculator {
    constructor() {
        this.initializeElements();
        this.attachEventListeners();
    }

    initializeElements() {
        this.weightInput = document.getElementById('weight');
        this.heightInput = document.getElementById('height');
        this.plateletUnitInput = document.getElementById('plateletUnit');
        this.transfusionsInput = document.getElementById('transfusions');
        this.plateletCountsInput = document.getElementById('plateletCounts');
        this.resultsTable = document.getElementById('resultsTable').getElementsByTagName('tbody')[0];
    }

    attachEventListeners() {
        const inputs = [this.weightInput, this.heightInput, this.plateletUnitInput, 
                       this.transfusionsInput, this.plateletCountsInput];
        
        inputs.forEach(input => {
            input.addEventListener('input', () => this.updateResults());
        });
    }

    parseTransfusions(text) {
        const regex = /(\d{2}\/\d{2}\/\d{2})\s+\d{4}\s+to\s+(\d{4})/g;
        const matches = [...text.matchAll(regex)];
        return matches.map(match => ({
            date: match[1],
            time: match[2]
        }));
    }

    parsePlateletCounts(text) {
        const regex = /(\d{2}\/\d{2}\/\d{2})\s+(\d{2}):(\d{2})\n(?:PLT:|Platelets:)\s+(\d+)/g;
        const matches = [...text.matchAll(regex)];
        return matches.map(match => ({
            date: match[1],
            time: `${match[2]}${match[3]}`,
            count: parseInt(match[4])
        }));
    }

    calculateBSA(weight, height) {
        return Math.sqrt((height * weight) / 3600);
    }

    calculateCCI(postCount, preCount, bsa, plateletUnit) {
        return ((postCount - preCount) * 1000 * bsa) / plateletUnit;
    }

    findClosestCount(targetDateTime, counts, hoursRange, isPreCount = false) {
        const targetTime = new Date(targetDateTime);
        let closest = null;
        let minDiff = Infinity;

        counts.forEach(count => {
            const countTime = new Date(count.date + ' ' + 
                count.time.replace(/(\d{2})(\d{2})/, '$1:$2'));
            const diffHours = (targetTime - countTime) / (1000 * 60 * 60);

            if (isPreCount) {
                // For pre-count: must be between 0 and 36 hours before
                if (diffHours > 0 && diffHours <= 36 && diffHours < minDiff) {
                    minDiff = diffHours;
                    closest = count;
                }
            } else {
                // For post-count: must be between 1 and 120 minutes after
                const diffMinutes = (countTime - targetTime) / (1000 * 60);
                if (diffMinutes >= 1 && diffMinutes <= 120 && diffMinutes/60 < minDiff) {
                    minDiff = diffMinutes/60;
                    closest = count;
                }
            }
        });

        return closest;
    }

    updateResults() {
        const weight = parseFloat(this.weightInput.value);
        const height = parseFloat(this.heightInput.value);
        const plateletUnit = parseFloat(this.plateletUnitInput.value) || 3;

        if (!weight || !height) return;

        const bsa = this.calculateBSA(weight, height);
        const transfusions = this.parseTransfusions(this.transfusionsInput.value);
        const counts = this.parsePlateletCounts(this.plateletCountsInput.value);

        this.resultsTable.innerHTML = '';

        // Create arrays to store adequate and inadequate responses
        const adequateResponses = [];
        const inadequateResponses = [];

        transfusions.forEach(transfusion => {
            const transfusionDateTime = new Date(transfusion.date + ' ' + 
                transfusion.time.replace(/(\d{2})(\d{2})/, '$1:$2'));

            const preCount = this.findClosestCount(transfusionDateTime, counts, 12, true);
            const postCount = this.findClosestCount(transfusionDateTime, counts, 1, false);

            let cci = null;
            if (preCount && postCount) {
                cci = this.calculateCCI(postCount.count, preCount.count, bsa, plateletUnit);

                // Calculate minutes between transfusion and post count
                const postDateTime = new Date(postCount.date + ' ' + 
                    postCount.time.replace(/(\d{2})(\d{2})/, '$1:$2'));
                const minutesAfter = Math.round((postDateTime - transfusionDateTime) / (1000 * 60));

                // Create summary entry
                const summaryEntry = `${transfusion.date} ${transfusion.time}, ` +
                                   `pre: ${preCount.count}, post: ${postCount.count} ` +
                                   `(${minutesAfter} mins after), CCI: ${cci.toFixed(0)}`;

                if (cci >= 7500) {
                    adequateResponses.push(summaryEntry);
                } else {
                    inadequateResponses.push(summaryEntry);
                }
            }

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${transfusion.date} ${transfusion.time}</td>
                <td>${preCount ? preCount.count : '-'}</td>
                <td>${postCount ? postCount.count : '-'}</td>
                <td>${cci ? cci.toFixed(0) : '-'}</td>
            `;

            if (cci !== null) {
                row.classList.add(cci < 7500 ? 'danger' : 'success');
            }

            this.resultsTable.appendChild(row);
        });

        // Create summary text
        const summaryText = 
            `${inadequateResponses.length} transfusions had an inadequate bump:\n` +
            inadequateResponses.map(entry => `• ${entry}`).join('\n') +
            `\n\n${adequateResponses.length} transfusions had an adequate bump:\n` +
            adequateResponses.map(entry => `• ${entry}`).join('\n');

        document.getElementById('summaryText').value = summaryText;
    }
}

// Initialize the calculator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PlateletCalculator();
}); 
