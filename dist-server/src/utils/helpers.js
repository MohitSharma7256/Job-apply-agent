"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cn = cn;
exports.formatDate = formatDate;
exports.formatTime = formatTime;
exports.getRelativeTime = getRelativeTime;
exports.getScoreColor = getScoreColor;
exports.getScoreBgColor = getScoreBgColor;
exports.truncateText = truncateText;
exports.validateEmail = validateEmail;
exports.validatePhone = validatePhone;
exports.debounce = debounce;
exports.generateId = generateId;
exports.sleep = sleep;
exports.getPlatformIcon = getPlatformIcon;
exports.getStatusColor = getStatusColor;
exports.filterJobs = filterJobs;
exports.sortJobs = sortJobs;
exports.calculateSuccessRate = calculateSuccessRate;
exports.exportToCSV = exportToCSV;
exports.downloadCSV = downloadCSV;
const clsx_1 = require("clsx");
const tailwind_merge_1 = require("tailwind-merge");
function cn(...inputs) {
    return (0, tailwind_merge_1.twMerge)((0, clsx_1.clsx)(inputs));
}
function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}
function formatTime(date) {
    const d = new Date(date);
    return d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
    });
}
function getRelativeTime(date) {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 60)
        return `${diffMins}m ago`;
    if (diffHours < 24)
        return `${diffHours}h ago`;
    if (diffDays < 7)
        return `${diffDays}d ago`;
    return formatDate(date);
}
function getScoreColor(score) {
    if (score >= 8)
        return 'text-green-600';
    if (score >= 6)
        return 'text-yellow-600';
    return 'text-gray-600';
}
function getScoreBgColor(score) {
    if (score >= 8)
        return 'bg-green-100';
    if (score >= 6)
        return 'bg-yellow-100';
    return 'bg-gray-100';
}
function truncateText(text, maxLength) {
    if (text.length <= maxLength)
        return text;
    return text.substring(0, maxLength) + '...';
}
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}
function validatePhone(phone) {
    const re = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    return re.test(phone);
}
function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function getPlatformIcon(platform) {
    const icons = {
        naukri: '📋',
        apna: '🚀',
        linkedin: '💼',
        indeed: '✅',
        internshala: '🎓',
        greenhouse: '🏢',
    };
    return icons[platform] || '🌐';
}
function getStatusColor(status) {
    const colors = {
        applied: 'bg-green-100 text-green-700',
        rejected: 'bg-red-100 text-red-700',
        interview: 'bg-blue-100 text-blue-700',
        offer: 'bg-purple-100 text-purple-700',
        pending: 'bg-yellow-100 text-yellow-700',
        new: 'bg-gray-100 text-gray-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
}
function filterJobs(jobs, filters) {
    return jobs.filter((job) => {
        if (filters.minScore && (job.matchScore || 0) < filters.minScore) {
            return false;
        }
        if (filters.platforms && !filters.platforms.includes(job.platform)) {
            return false;
        }
        if (filters.jobTypes && !filters.jobTypes.includes(job.jobType)) {
            return false;
        }
        if (filters.locations && !filters.locations.some((l) => job.location.toLowerCase().includes(l.toLowerCase()))) {
            return false;
        }
        return true;
    });
}
function sortJobs(jobs, sortBy) {
    const sorted = [...jobs];
    switch (sortBy) {
        case 'score':
            return sorted.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
        case 'date':
            return sorted.sort((a, b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime());
        case 'company':
            return sorted.sort((a, b) => a.company.localeCompare(b.company));
        case 'salary':
            return sorted.sort((a, b) => {
                const aSalary = parseSalary(a.salary);
                const bSalary = parseSalary(b.salary);
                return bSalary - aSalary;
            });
        default:
            return sorted;
    }
}
function parseSalary(salary) {
    if (!salary)
        return 0;
    const match = salary.match(/[\d,]+/);
    if (match) {
        return parseInt(match[0].replace(/,/g, ''), 10);
    }
    return 0;
}
function calculateSuccessRate(applied, responses) {
    if (applied === 0)
        return 0;
    return Math.round((responses / applied) * 100);
}
function exportToCSV(applications) {
    const headers = [
        'Date',
        'Time',
        'Job Title',
        'Company',
        'Location',
        'Salary',
        'Platform',
        'Status',
    ];
    const rows = applications.map((app) => [
        new Date(app.appliedAt).toLocaleDateString(),
        new Date(app.appliedAt).toLocaleTimeString(),
        app.jobTitle,
        app.company,
        app.location,
        app.salary || 'N/A',
        app.platform,
        app.status,
    ]);
    return [headers, ...rows].map((row) => row.join(',')).join('\n');
}
function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}
