import React, { useState, useEffect } from 'react';
import { 
  GitCompare, Eye, EyeOff, CheckCircle, XCircle, AlertTriangle,
  ChevronDown, ChevronUp, RefreshCw, Download, Copy, Check,
  Plus, Minus, Search, Filter, Clock, FileText, Edit3, Lock,
  Unlock, Zap, Target, Shield, Info
} from 'lucide-react';

const DiffViewer = ({ 
  originalContent, 
  tailoredContent, 
  sections = [],
  onAcceptChanges,
  onRejectChanges,
  onEditSection,
  lockedSections = [],
  showMetadata = true,
  compact = false
}) => {
  const [diffData, setDiffData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [expandedSections, setExpandedSections] = useState(new Set());
  const [showOriginal, setShowOriginal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [copiedSection, setCopiedSection] = useState(null);

  useEffect(() => {
    if (originalContent && tailoredContent) {
      calculateDiff();
    }
  }, [originalContent, tailoredContent]);

  const calculateDiff = () => {
    setLoading(true);
    
    try {
      const diff = generateDiff(originalContent, tailoredContent, sections);
      setDiffData(diff);
    } catch (error) {
      console.error('Diff calculation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateDiff = (original, tailored, sections) => {
    const diff = {
      summary: {
        totalChanges: 0,
        additions: 0,
        removals: 0,
        modifications: 0,
        sectionsModified: 0,
        lockedSections: lockedSections.length
      },
      sections: [],
      overallChange: 0
    };

    if (sections.length > 0) {
      // Section-based diff
      sections.forEach(section => {
        const originalSection = section.originalContent || '';
        const tailoredSection = section.content || '';
        
        if (lockedSections.includes(section.id)) {
          diff.sections.push({
            id: section.id,
            type: section.type,
            title: section.title,
            locked: true,
            changes: [],
            changeCount: 0,
            originalContent: originalSection,
            tailoredContent: originalSection // Same as original since locked
          });
        } else {
          const sectionDiff = calculateSectionDiff(originalSection, tailoredSection, section);
          diff.sections.push(sectionDiff);
          
          // Update summary
          diff.summary.totalChanges += sectionDiff.changeCount;
          diff.summary.additions += sectionDiff.additions;
          diff.summary.removals += sectionDiff.removals;
          diff.summary.modifications += sectionDiff.modifications;
          if (sectionDiff.changeCount > 0) {
            diff.summary.sectionsModified++;
          }
        }
      });
    } else {
      // Full content diff
      const fullDiff = calculateSectionDiff(original, tailored);
      diff.sections.push({
        id: 'full_content',
        type: 'full',
        title: 'Full Content',
        locked: false,
        ...fullDiff
      });
      
      diff.summary.totalChanges = fullDiff.changeCount;
      diff.summary.additions = fullDiff.additions;
      diff.summary.removals = fullDiff.removals;
      diff.summary.modifications = fullDiff.modifications;
      diff.summary.sectionsModified = fullDiff.changeCount > 0 ? 1 : 0;
    }

    // Calculate overall change percentage
    const originalLength = original.length;
    const tailoredLength = tailored.length;
    diff.overallChange = originalLength > 0 
      ? ((tailoredLength - originalLength) / originalLength * 100).toFixed(1)
      : 0;

    return diff;
  };

  const calculateSectionDiff = (original, tailored, sectionInfo = null) => {
    const changes = [];
    const originalLines = original.split('\n');
    const tailoredLines = tailored.split('\n');
    
    // Simple line-by-line diff (in production, use a proper diff algorithm)
    const maxLines = Math.max(originalLines.length, tailoredLines.length);
    let additions = 0;
    let removals = 0;
    let modifications = 0;

    for (let i = 0; i < maxLines; i++) {
      const originalLine = originalLines[i] || '';
      const tailoredLine = tailoredLines[i] || '';

      if (originalLine === tailoredLine) {
        // No change
        continue;
      } else if (!originalLine && tailoredLine) {
        // Addition
        changes.push({
          type: 'add',
          lineNumber: i + 1,
          content: tailoredLine,
          originalContent: null
        });
        additions++;
      } else if (originalLine && !tailoredLine) {
        // Removal
        changes.push({
          type: 'remove',
          lineNumber: i + 1,
          content: originalLine,
          originalContent: originalLine
        });
        removals++;
      } else {
        // Modification
        changes.push({
          type: 'modify',
          lineNumber: i + 1,
          content: tailoredLine,
          originalContent: originalLine
        });
        modifications++;
      }
    }

    return {
      ...(sectionInfo && { id: sectionInfo.id, type: sectionInfo.type, title: sectionInfo.title }),
      locked: sectionInfo?.locked || false,
      changes,
      changeCount: additions + removals + modifications,
      additions,
      removals,
      modifications,
      originalContent: original,
      tailoredContent: tailored
    };
  };

  const toggleSectionExpansion = (sectionId) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const filterChanges = (changes) => {
    if (filterType === 'all') return changes;
    return changes.filter(change => change.type === filterType.slice(0, -1)); // Remove 's' from 'adds', etc.
  };

  const searchChanges = (changes) => {
    if (!searchTerm) return changes;
    const searchLower = searchTerm.toLowerCase();
    return changes.filter(change => 
      change.content.toLowerCase().includes(searchLower) ||
      (change.originalContent && change.originalContent.toLowerCase().includes(searchLower))
    );
  };

  const copyToClipboard = async (text, sectionId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(sectionId);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getChangeIcon = (type) => {
    switch (type) {
      case 'add': return <Plus className="w-4 h-4 text-green-500" />;
      case 'remove': return <Minus className="w-4 h-4 text-red-500" />;
      case 'modify': return <Edit3 className="w-4 h-4 text-yellow-500" />;
      default: return <GitCompare className="w-4 h-4 text-gray-500" />;
    }
  };

  const getChangeColor = (type) => {
    switch (type) {
      case 'add': return 'text-green-500';
      case 'remove': return 'text-red-500';
      case 'modify': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  const getChangeBgColor = (type) => {
    switch (type) {
      case 'add': return 'bg-green-500/10 border-green-500/20';
      case 'remove': return 'bg-red-500/10 border-red-500/20';
      case 'modify': return 'bg-yellow-500/10 border-yellow-500/20';
      default: return 'bg-gray-500/10 border-gray-500/20';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-400 mr-2" />
        <span className="text-gray-400">Calculating differences...</span>
      </div>
    );
  }

  if (!diffData) {
    return (
      <div className="text-center p-8 text-gray-400">
        <GitCompare className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No differences to display</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      {showMetadata && (
        <div className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold flex items-center">
              <GitCompare className="w-5 h-5 text-blue-400 mr-2" />
              Content Changes
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowOriginal(!showOriginal)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                title={showOriginal ? "Show Tailored" : "Show Original"}
              >
                {showOriginal ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <button
                onClick={calculateDiff}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                title="Refresh Diff"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{diffData.summary.totalChanges}</div>
              <div className="text-sm text-gray-400">Total Changes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{diffData.summary.additions}</div>
              <div className="text-sm text-gray-400">Additions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">{diffData.summary.removals}</div>
              <div className="text-sm text-gray-400">Removals</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">{diffData.summary.modifications}</div>
              <div className="text-sm text-gray-400">Modifications</div>
            </div>
          </div>

          {diffData.overallChange !== 0 && (
            <div className="mt-4 text-center">
              <span className="text-sm text-gray-400">Overall content change: </span>
              <span className={`text-sm font-bold ${diffData.overallChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                {diffData.overallChange > 0 ? '+' : ''}{diffData.overallChange}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search changes..."
            className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-lg outline-none focus:border-blue-500/50 text-white"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 bg-black/40 border border-white/10 rounded-lg outline-none focus:border-blue-500/50 text-white"
          >
            <option value="all">All Changes</option>
            <option value="adds">Additions</option>
            <option value="removes">Removals</option>
            <option value="modifies">Modifications</option>
          </select>
        </div>
      </div>

      {/* Section Changes */}
      <div className="space-y-4">
        {diffData.sections.map(section => {
          const isExpanded = expandedSections.has(section.id);
          const filteredChanges = searchChanges(filterChanges(section.changes));
          const displayChanges = compact && !isExpanded ? filteredChanges.slice(0, 3) : filteredChanges;

          return (
            <div key={section.id} className="rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl overflow-hidden">
              {/* Section Header */}
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {section.locked ? (
                      <Lock className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Unlock className="w-4 h-4 text-blue-400" />
                    )}
                    <div>
                      <h4 className="font-semibold text-white">{section.title}</h4>
                      <p className="text-sm text-gray-400 capitalize">{section.type}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 text-sm">
                      {section.changeCount > 0 && (
                        <>
                          <span className="text-green-400">+{section.additions}</span>
                          <span className="text-red-400">-{section.removals}</span>
                          <span className="text-yellow-400">~{section.modifications}</span>
                        </>
                      )}
                      {section.locked && (
                        <span className="text-gray-400">Locked</span>
                      )}
                    </div>
                    
                    <button
                      onClick={() => toggleSectionExpansion(section.id)}
                      className="p-1 rounded hover:bg-white/10 transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Section Content */}
              <div className="divide-y divide-white/10">
                {displayChanges.map((change, index) => (
                  <div key={index} className={`p-4 ${getChangeBgColor(change.type)} border-l-4`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getChangeIcon(change.type)}
                        <span className={`text-sm font-semibold ${getChangeColor(change.type)}`}>
                          Line {change.lineNumber}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => copyToClipboard(showOriginal ? change.originalContent : change.content, `${section.id}_${index}`)}
                          className="p-1 rounded hover:bg-white/10 transition-colors"
                          title="Copy"
                        >
                          {copiedSection === `${section.id}_${index}` ? (
                            <Check className="w-3 h-3 text-green-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-gray-400" />
                          )}
                        </button>
                        
                        {!section.locked && onEditSection && (
                          <button
                            onClick={() => onEditSection(section.id, change)}
                            className="p-1 rounded hover:bg-white/10 transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-3 h-3 text-gray-400" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {change.originalContent && (
                        <div className="text-sm">
                          <span className="text-red-400 line-through">
                            {change.originalContent}
                          </span>
                        </div>
                      )}
                      
                      <div className="text-sm text-white">
                        {showOriginal && change.originalContent ? (
                          <span className="text-green-400">
                            {change.content}
                          </span>
                        ) : (
                          <span>{change.content}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {compact && !isExpanded && filteredChanges.length > 3 && (
                  <div className="p-4 text-center">
                    <button
                      onClick={() => toggleSectionExpansion(section.id)}
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      Show {filteredChanges.length - 3} more changes
                    </button>
                  </div>
                )}
              </div>

              {/* Section Actions */}
              {section.changeCount > 0 && !section.locked && (
                <div className="p-4 border-t border-white/10 flex justify-between">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onRejectChanges?.(section.id)}
                      className="px-3 py-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm"
                    >
                      Reject Changes
                    </button>
                    <button
                      onClick={() => onAcceptChanges?.(section.id)}
                      className="px-3 py-1 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors text-sm"
                    >
                      Accept Changes
                    </button>
                  </div>
                  
                  <button
                    onClick={() => copyToClipboard(showOriginal ? section.originalContent : section.tailoredContent, section.id)}
                    className="px-3 py-1 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-sm flex items-center"
                  >
                    {copiedSection === section.id ? (
                      <>
                        <Check className="w-3 h-3 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 mr-1" />
                        Copy Section
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Global Actions */}
      {diffData.summary.totalChanges > 0 && (
        <div className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-400">
              {diffData.summary.totalChanges} total changes across {diffData.summary.sectionsModified} sections
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => onRejectChanges?.('all')}
                className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
              >
                Reject All
              </button>
              <button
                onClick={() => onAcceptChanges?.('all')}
                className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiffViewer;
