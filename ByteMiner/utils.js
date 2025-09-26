// Byte Miner: Core Collapse - Utility Functions

const Utils = {
    // Format large numbers with appropriate suffixes
    formatNumber(num) {
        if (num < 1000) return Math.floor(num).toString();
        if (num < 1000000) return (num / 1000).toFixed(1) + 'K';
        if (num < 1000000000) return (num / 1000000).toFixed(1) + 'M';
        if (num < 1000000000000) return (num / 1000000000).toFixed(1) + 'B';
        if (num < 1000000000000000) return (num / 1000000000000).toFixed(1) + 'T';
        if (num < 1000000000000000000) return (num / 1000000000000000).toFixed(1) + 'Q';
        return (num / 1000000000000000000).toFixed(1) + 'Qi';
    },

    // Format bytes with proper units (matching the game theme)
    formatBytes(bytes) {
        if (bytes < 1000) return Math.floor(bytes) + ' Bytes';
        if (bytes < 1000000) return (bytes / 1000).toFixed(1) + ' KB';
        if (bytes < 1000000000) return (bytes / 1000000).toFixed(1) + ' MB';
        if (bytes < 1000000000000) return (bytes / 1000000000).toFixed(1) + ' GB';
        if (bytes < 1000000000000000) return (bytes / 1000000000000).toFixed(1) + ' TB';
        if (bytes < 1000000000000000000) return (bytes / 1000000000000000).toFixed(1) + ' PB';
        return (bytes / 1000000000000000000).toFixed(1) + ' EB';
    },

    // Calculate upgrade cost with exponential scaling
    calculateCost(baseCost, level, multiplier) {
        return Math.floor(baseCost * Math.pow(multiplier, level));
    },

    // Parse scaling notation (e.g., "×2ⁿ" → 2)
    parseScaling(scalingStr) {
        const match = scalingStr.match(/×([\d.]+)/);
        return match ? parseFloat(match[1]) : 1.5;
    },

    // Calculate effect based on level and scaling
    calculateEffect(baseEffect, level, scaling) {
        if (typeof baseEffect === 'string') {
            if (baseEffect.includes('%')) {
                const percent = parseFloat(baseEffect.replace('%', ''));
                return percent * Math.pow(scaling, level - 1);
            }
            if (baseEffect.includes('/')) {
                const parts = baseEffect.split('/');
                const value = parseFloat(parts[0].replace('+', ''));
                return value * Math.pow(scaling, level - 1);
            }
        }
        return baseEffect * Math.pow(scaling, level - 1);
    },

    // Generate random color for effects
    randomColor() {
        const colors = ['#00ff41', '#ff00ff', '#00ffff', '#ffff00', '#ff4444', '#44ff44', '#4444ff'];
        return colors[Math.floor(Math.random() * colors.length)];
    },

    // Clamp value between min and max
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Deep clone object
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => Utils.deepClone(item));
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = Utils.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    },

    // Create notification element
    createNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        const container = document.getElementById('notifications');
        container.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Auto remove
        setTimeout(() => {
            notification.classList.remove('show');
            notification.classList.add('slide-out');
            setTimeout(() => container.removeChild(notification), 300);
        }, duration);
        
        return notification;
    },

    // Create click effect
    createClickEffect(x, y, value) {
        const effect = document.createElement('div');
        effect.className = 'click-effect';
        effect.textContent = '+' + Utils.formatNumber(value);
        effect.style.left = x + 'px';
        effect.style.top = y + 'px';
        
        const container = document.getElementById('click-effects');
        container.appendChild(effect);
        
        // Remove after animation
        setTimeout(() => {
            if (container.contains(effect)) {
                container.removeChild(effect);
            }
        }, 1000);
    },

    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle function
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Calculate time played in readable format
    formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
        if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    },

    // Calculate offline earnings time
    calculateOfflineTime(lastSave) {
        const now = Date.now();
        const timeDiff = now - lastSave;
        return Math.max(0, timeDiff);
    },

    // Encode/decode save data
    encodeSave(data) {
        return btoa(JSON.stringify(data));
    },

    decodeSave(encodedData) {
        try {
            return JSON.parse(atob(encodedData));
        } catch (e) {
            return null;
        }
    },

    // Calculate prestige requirements
    calculatePrestigeRequirement(prestigeCount) {
        return Math.floor(1000000 * Math.pow(2.5, prestigeCount));
    },

    // Calculate core fragments from bytes
    calculateCoreFragments(totalBytes) {
        return Math.floor(totalBytes / 1000000);
    },

    // Check if upgrade is affordable
    isAffordable(cost, currency) {
        return currency >= cost;
    },

    // Calculate bytes per second display
    formatBytesPerSecond(bps) {
        if (bps < 1) return (bps * 1000).toFixed(0) + ' B/ms';
        return Utils.formatNumber(bps) + ' B/s';
    },

    // Animate number change
    animateNumber(element, startVal, endVal, duration = 1000) {
        const range = endVal - startVal;
        const increment = range / (duration / 16);
        let current = startVal;
        
        const timer = setInterval(() => {
            current += increment;
            if ((increment > 0 && current >= endVal) || (increment < 0 && current <= endVal)) {
                current = endVal;
                clearInterval(timer);
            }
            element.textContent = Utils.formatNumber(current);
        }, 16);
    },

    // Random chance calculation
    randomChance(percentage) {
        return Math.random() * 100 < percentage;
    },

    // Lerp function for smooth transitions
    lerp(start, end, factor) {
        return start + (end - start) * factor;
    },

    // Check if element is visible in viewport
    isElementVisible(element) {
        const rect = element.getBoundingClientRect();
        return rect.top >= 0 && rect.left >= 0 && 
               rect.bottom <= window.innerHeight && 
               rect.right <= window.innerWidth;
    },

    // Smooth scroll to element
    scrollToElement(element, duration = 500) {
        const targetPosition = element.offsetTop;
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        let startTime = null;

        function animation(currentTime) {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const run = Utils.easeInOutQuad(timeElapsed, startPosition, distance, duration);
            window.scrollTo(0, run);
            if (timeElapsed < duration) requestAnimationFrame(animation);
        }

        requestAnimationFrame(animation);
    },

    // Easing function for smooth animations
    easeInOutQuad(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    },

    // Validate save data integrity
    validateSaveData(data) {
        const requiredFields = ['bytes', 'totalBytes', 'coreFragments', 'quantumKeys', 'upgrades', 'achievements'];
        
        if (!data || typeof data !== 'object') return false;
        
        for (const field of requiredFields) {
            if (!(field in data)) return false;
        }
        
        // Validate data types
        if (typeof data.bytes !== 'number' || data.bytes < 0) return false;
        if (typeof data.totalBytes !== 'number' || data.totalBytes < 0) return false;
        if (typeof data.coreFragments !== 'number' || data.coreFragments < 0) return false;
        if (typeof data.quantumKeys !== 'number' || data.quantumKeys < 0) return false;
        
        return true;
    }
};

// Export for other modules
window.Utils = Utils;