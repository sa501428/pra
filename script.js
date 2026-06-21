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
        const regex = /(\d{2}\/\d{2}\/\d{2})\s+(\d{4})\s+to\s+(\d{4})/g;
        const matches = [...text.matchAll(regex)];
        return matches.map(match => ({
            date: match[1],
            startTime: match[2],
            endTime: match[3]
        }));
    }

    parsePlateletCounts(text) {
        const regex = /(\d{2}\/\d{2}\/\d{2})\s+([0-2][0-9]):([0-5][0-9])\s*[\r\n]+(?:PLT(?: \([A-Za-z\s]+\))?:|Platelets(?: \([A-Za-z\s]+\))?:)\s*(\d+)/g;

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

    findPreCount(transfusionStartDateTime, counts) {
        const startTime = new Date(transfusionStartDateTime);
        let closest = null;
        let minDiff = Infinity;

        counts.forEach(count => {
            const countTime = new Date(count.date + ' ' +
                count.time.replace(/(\d{2})(\d{2})/, '$1:$2'));
            const diffHours = (startTime - countTime) / (1000 * 60 * 60);
            // Must be 0–36 hours before transfusion START (not during or after)
            if (diffHours > 0 && diffHours <= 36 && diffHours < minDiff) {
                minDiff = diffHours;
                closest = count;
            }
        });

        return closest;
    }

    findPostCount(transfusionEndDateTime, counts) {
        const endTime = new Date(transfusionEndDateTime);
        let closest = null;
        let minDiff = Infinity;

        counts.forEach(count => {
            const countTime = new Date(count.date + ' ' +
                count.time.replace(/(\d{2})(\d{2})/, '$1:$2'));
            // Must be 1–120 minutes after transfusion END
            const diffMinutes = (countTime - endTime) / (1000 * 60);
            if (diffMinutes >= 1 && diffMinutes <= 120 && diffMinutes < minDiff) {
                minDiff = diffMinutes;
                closest = count;
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
            // If end time < start time the transfusion crossed midnight — end date is the next calendar day
            let endDateStr = transfusion.date;
            if (parseInt(transfusion.endTime) < parseInt(transfusion.startTime)) {
                const parts = transfusion.date.split('/');
                const d = new Date(+('20' + parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
                d.setDate(d.getDate() + 1);
                endDateStr = String(d.getMonth() + 1).padStart(2, '0') + '/' +
                             String(d.getDate()).padStart(2, '0') + '/' +
                             String(d.getFullYear()).slice(-2);
            }
            const transfusionDateTime = new Date(endDateStr + ' ' +
                transfusion.endTime.replace(/(\d{2})(\d{2})/, '$1:$2'));

            const transfusionStartDateTime = new Date(transfusion.date + ' ' +
                transfusion.startTime.replace(/(\d{2})(\d{2})/, '$1:$2'));
            const preCount = this.findPreCount(transfusionStartDateTime, counts);
            const postCount = this.findPostCount(transfusionDateTime, counts);

            let cci = null;
            if (preCount && postCount) {
                cci = this.calculateCCI(postCount.count, preCount.count, bsa, plateletUnit);

                // Calculate minutes between transfusion and post count
                const postDateTime = new Date(postCount.date + ' ' + 
                    postCount.time.replace(/(\d{2})(\d{2})/, '$1:$2'));
                const minutesAfter = Math.round((postDateTime - transfusionDateTime) / (1000 * 60));

                // Create summary entry
                const summaryEntry = `${transfusion.date} ${transfusion.startTime} to ${transfusion.endTime}, ` +
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
                <td>${transfusion.date} ${transfusion.startTime} to ${transfusion.endTime}</td>
                <td>${preCount ? preCount.count : '-'}</td>
                <td>${postCount ? postCount.count : '-'}</td>
                <td>${cci !== null ? cci.toFixed(0) : '-'}</td>
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
