// Bitcoin Clicker - Utility Functions

class Utils {
    // Format large numbers with appropriate suffixes
    static formatNumber(num) {
        if (num < 1000) return num.toFixed(2);
        if (num < 1000000) return (num / 1000).toFixed(2) + 'K';
        if (num < 1000000000) return (num / 1000000).toFixed(2) + 'M';
        if (num < 1000000000000) return (num / 1000000000).toFixed(2) + 'B';
        if (num < 1000000000000000) return (num / 1000000000000).toFixed(2) + 'T';
        return (num / 1000000000000000).toFixed(2) + 'Q';
    }

    // Format BTC with proper precision
    static formatBTC(btc) {
        if (btc >= 1) return btc.toFixed(4) + ' ₿';
        if (btc >= 0.001) return btc.toFixed(6) + ' ₿';
        return btc.toFixed(8) + ' ₿';
    }

    // Format USD values
    static formatUSD(amount) {
        if (amount < 1000) return '$' + amount.toFixed(2);
        if (amount < 1000000) return '$' + (amount / 1000).toFixed(2) + 'K';
        if (amount < 1000000000) return '$' + (amount / 1000000).toFixed(2) + 'M';
        if (amount < 1000000000000) return '$' + (amount / 1000000000).toFixed(2) + 'B';
        return '$' + (amount / 1000000000000).toFixed(2) + 'T';
    }

    // Format time
    static formatTime(seconds) {
        if (seconds < 60) return seconds.toFixed(0) + 's';
        if (seconds < 3600) return (seconds / 60).toFixed(1) + 'm';
        if (seconds < 86400) return (seconds / 3600).toFixed(1) + 'h';
        return (seconds / 86400).toFixed(1) + 'd';
    }

    // Create floating text effect for clicks
    static createClickEffect(x, y, text) {
        const effect = document.createElement('div');
        effect.className = 'click-effect';
        effect.textContent = text;
        effect.style.left = x + 'px';
        effect.style.top = y + 'px';
        
        const container = document.getElementById('click-effects');
        container.appendChild(effect);
        
        setTimeout(() => {
            if (container.contains(effect)) {
                container.removeChild(effect);
            }
        }, 1000);
    }

    // Create notification
    static createNotification(title, message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const titleEl = document.createElement('div');
        titleEl.className = 'notification-title';
        titleEl.textContent = title;
        
        const messageEl = document.createElement('div');
        messageEl.className = 'notification-message';
        messageEl.textContent = message;
        
        notification.appendChild(titleEl);
        notification.appendChild(messageEl);
        
        const container = document.getElementById('notifications');
        container.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => {
                if (container.contains(notification)) {
                    container.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    // Calculate efficiency based on power usage
    static calculatePowerEfficiency(used, capacity) {
        if (capacity === 0) return 0;
        const ratio = used / capacity;
        if (ratio <= 1) return 1; // Full efficiency when under capacity
        // Gradual reduction in efficiency when over capacity
        // At 2x capacity, efficiency is 50%
        return 1 / ratio;
    }

    // Random integer between min and max (inclusive)
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Random float between min and max
    static randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }

    // Percentage chance (0-100)
    static chance(percentage) {
        return Math.random() * 100 < percentage;
    }

    // Clamp value between min and max
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    // Linear interpolation
    static lerp(start, end, amount) {
        return start + (end - start) * amount;
    }

    // Get element position for effects
    static getElementCenter(element) {
        const rect = element.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    }
}
