// ===== Enhanced Code Editor with VS Code-like Features =====

// Editor State
let editorState = {
    code: '',
    cursorPosition: 0,
    selectionStart: 0,
    selectionEnd: 0,
    suggestions: [],
    errors: [],
    isAutoCompleteOpen: false
};

// JavaScript Keywords and Built-ins for Auto-completion
const JS_KEYWORDS = [
    'let', 'const', 'var', 'function', 'if', 'else', 'for', 'while', 'do', 'switch',
    'case', 'break', 'continue', 'return', 'try', 'catch', 'finally', 'throw', 'new',
    'this', 'class', 'extends', 'super', 'static', 'async', 'await', 'import', 'export',
    'default', 'from', 'as', 'typeof', 'instanceof', 'in', 'of', 'true', 'false', 'null',
    'undefined', 'NaN', 'Infinity', 'console', 'document', 'window', 'Array', 'Object',
    'String', 'Number', 'Boolean', 'Date', 'Math', 'JSON', 'Promise', 'Set', 'Map'
];

const JS_BUILTINS = [
    'log', 'error', 'warn', 'info', 'clear', 'getElementById', 'querySelector',
    'createElement', 'appendChild', 'innerHTML', 'textContent', 'addEventListener',
    'setAttribute', 'getAttribute', 'classList', 'style', 'length', 'push', 'pop',
    'shift', 'unshift', 'map', 'filter', 'reduce', 'forEach', 'find', 'findIndex',
    'some', 'every', 'includes', 'indexOf', 'slice', 'splice', 'join', 'split',
    'toString', 'toUpperCase', 'toLowerCase', 'parseInt', 'parseFloat', 'isNaN',
    'isFinite', 'stringify', 'parse', 'keys', 'values', 'entries'
];

// Syntax Highlighting Rules
const syntaxRules = {
    keywords: /\b(let|const|var|function|if|else|for|while|do|switch|case|break|continue|return|try|catch|finally|throw|new|this|class|extends|super|static|async|await|import|export|default|from|as|typeof|instanceof|in|of|true|false|null|undefined)\b/g,
    strings: /("([^"\\]|\\.)*"|'([^'\\]|\\.)*'|`([^`\\]|\\.)*`)/g,
    numbers: /\b\d+\.?\d*\b/g,
    comments: /(\/\/.*$|\/\*[\s\S]*?\*\/)/gm,
    functions: /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g,
    operators: /([+\-*/%=<>!&|]+)/g
};

// Initialize Enhanced Editor
function initEnhancedEditor() {
    // Wait for DOM to be ready
    setTimeout(() => {
        const editor = document.getElementById('advancedCodeEditor');
        const editorWrapper = document.querySelector('.code-editor-wrapper');
        const lineNumbers = document.getElementById('editorLineNumbers');
        
        if (!editor) {
            console.warn('Editor not found, retrying...');
            setTimeout(initEnhancedEditor, 100);
            return;
        }
        
        // Ensure syntax overlay exists
        let syntaxOverlay = document.getElementById('syntaxOverlay');
        if (!syntaxOverlay && editorWrapper) {
            syntaxOverlay = document.createElement('div');
            syntaxOverlay.id = 'syntaxOverlay';
            syntaxOverlay.className = 'syntax-overlay';
            editorWrapper.appendChild(syntaxOverlay);
        }
        
        // Ensure autocomplete list exists
        let autoCompleteList = document.getElementById('autoCompleteList');
        if (!autoCompleteList && editorWrapper) {
            autoCompleteList = document.createElement('div');
            autoCompleteList.id = 'autoCompleteList';
            autoCompleteList.className = 'autocomplete-list';
            document.body.appendChild(autoCompleteList); // Append to body for proper positioning
        }
        
        // Ensure error panel exists
        let errorPanel = document.getElementById('errorPanel');
        if (!errorPanel) {
            const editorWrapper = document.querySelector('.editor-wrapper');
            if (editorWrapper) {
                errorPanel = document.createElement('div');
                errorPanel.id = 'errorPanel';
                errorPanel.className = 'error-panel';
                editorWrapper.appendChild(errorPanel);
            }
        }
        
        // Initial setup
        updateLineNumbers();
        updateSyntaxHighlighting();
        
        // Setup editor event listeners (handles everything)
        setupEditorEvents(editor, lineNumbers);
        
        // Note: setupSyntaxHighlighting, setupAutoComplete, setupErrorDetection, 
        // and setupKeyboardShortcuts are now all handled in setupEditorEvents
        // to avoid duplicate event listeners and conflicts
        
        // Initial sync
        syncSyntaxOverlay();
    }, 100);
}

// Setup Editor Events (Simplified and Non-Intrusive)
function setupEditorEvents(editor, lineNumbers) {
    if (!editor) return;
    
    // Debounce timers (scoped to function)
    let inputTimeout;
    let syntaxTimeout;
    let autocompleteTimeout;
    
    // Input handler - INSTANT response, ZERO delays
    editor.addEventListener('input', (e) => {
        // Mark as typing
        isTyping = true;
        
        // Hide syntax overlay immediately for instant response
        const overlay = document.getElementById('syntaxOverlay');
        if (overlay) {
            overlay.style.display = 'none';
            overlay.innerHTML = '';
        }
        
        // Update state immediately (no delay)
        editorState.code = editor.value;
        
        // Update line numbers immediately (fast operation)
        updateLineNumbers();
        
        // Sync scroll IMMEDIATELY (no delay)
        syncEditorScroll();
        
        // Clear typing flag after a delay
        clearTimeout(syntaxTimeout);
        syntaxTimeout = setTimeout(() => {
            isTyping = false;
            // Only highlight when user stops typing
            updateSyntaxHighlighting();
        }, 2000); // Wait 2 seconds after user stops typing
        
        // Error detection - very delayed
        clearTimeout(inputTimeout);
        inputTimeout = setTimeout(() => {
            detectErrors();
        }, 1500);
        
        // Auto-complete - VERY passive
        clearTimeout(autocompleteTimeout);
        autocompleteTimeout = setTimeout(() => {
            if (document.activeElement !== editor) {
                hideAutoComplete();
                return;
            }
            
            const cursorPos = editor.selectionStart;
            const textBefore = editor.value.substring(0, cursorPos);
            const lastChar = textBefore.charAt(textBefore.length - 1);
            
            if (lastChar && /[a-zA-Z_$]/.test(lastChar)) {
                const wordMatch = textBefore.match(/([a-zA-Z_$][a-zA-Z0-9_$]*)$/);
                if (wordMatch && wordMatch[1].length >= 3) {
                    updateAutoComplete(e);
                } else {
                    hideAutoComplete();
                }
            } else {
                hideAutoComplete();
            }
        }, 1000);
    }, { passive: true });
    
    // Sync scroll - INSTANT sync (no delay)
    editor.addEventListener('scroll', () => {
        syncEditorScroll();
    }, { passive: true });
    
    // Click handler - just hide autocomplete
    editor.addEventListener('click', () => {
        hideAutoComplete();
    });
    
    // Keyboard handlers - MINIMAL interference
    editor.addEventListener('keydown', (e) => {
        // Only handle specific cases, let everything else work normally
        
        // 1. Autocomplete navigation (only if open)
        if (editorState.isAutoCompleteOpen) {
            const handled = handleAutoCompleteKeys(e);
            if (handled) return; // Key was handled, stop propagation
        }
        
        // 2. Keyboard shortcuts (Ctrl/Cmd combinations only)
        if (e.ctrlKey || e.metaKey) {
            const handled = handleShortcuts(e);
            if (handled) return;
        }
        
        // 3. Tab key (indentation)
        if (e.key === 'Tab' && !e.ctrlKey && !e.metaKey) {
            handleTabKey(e);
            return;
        }
        
        // 4. Handle closing bracket skip FIRST (if user types closing bracket and next char is already that bracket, skip it)
        // This must come before auto-closing to prevent duplicate brackets
        if (!e.ctrlKey && !e.metaKey) {
            const handled = handleClosingBracketSkip(e);
            if (handled) return;
        }
        
        // 5. Auto-closing brackets/tags (after skip check)
        if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
            const handled = handleAutoClosing(e);
            if (handled) return;
        }
        
        // 6. Enter key - NO auto-indent to avoid interference
        // Enter key works completely normally - no modification
        // User can use Tab for indentation manually if needed
        
        // All other keys work completely normally - no interference!
    });
    
    // Keyup - just for cleanup
    editor.addEventListener('keyup', (e) => {
        // Hide autocomplete on navigation keys
        if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
            hideAutoComplete();
        }
    });
}

// Helper function to hide autocomplete
function hideAutoComplete() {
    const autocomplete = document.getElementById('autoCompleteList');
    if (autocomplete) {
        autocomplete.style.display = 'none';
        editorState.isAutoCompleteOpen = false;
    }
}

// Update Line Numbers
function updateLineNumbers() {
    const editor = document.getElementById('advancedCodeEditor');
    const lineNumbers = document.getElementById('editorLineNumbers');
    
    if (!editor || !lineNumbers) return;
    
    const lines = editor.value.split('\n');
    const lineCount = lines.length;
    
    let numbersHtml = '';
    for (let i = 1; i <= Math.max(lineCount, 1); i++) {
        numbersHtml += `<div class="line-number">${i}</div>`;
    }
    
    lineNumbers.innerHTML = numbersHtml;
    
    // Sync scroll
    syncEditorScroll();
}

// Update Syntax Highlighting (DISABLED during typing for instant response)
let syntaxHighlightTimeout;
let lastHighlightedCode = '';
let isHighlighting = false;
let isTyping = false;

function updateSyntaxHighlighting() {
    // Don't highlight while typing
    if (isTyping) {
        // Just clear overlay for instant response
        const overlay = document.getElementById('syntaxOverlay');
        if (overlay) {
            overlay.innerHTML = '';
        }
        return;
    }
    
    // Don't update if already highlighting
    if (isHighlighting) return;
    
    clearTimeout(syntaxHighlightTimeout);
    syntaxHighlightTimeout = setTimeout(() => {
        try {
            const editor = document.getElementById('advancedCodeEditor');
            const overlay = document.getElementById('syntaxOverlay');
            
            if (!editor || !overlay) return;
            
            const code = editor.value;
            
            // Skip if code hasn't changed
            if (code === lastHighlightedCode) {
                syncSyntaxOverlay();
                return;
            }
            
            // Mark as highlighting
            isHighlighting = true;
            lastHighlightedCode = code;
            
            // Handle empty code
            if (!code || code.trim().length === 0) {
                overlay.innerHTML = '';
                overlay.style.display = 'none';
                syncSyntaxOverlay();
                isHighlighting = false;
                return;
            }
            
            // Highlight in background
            const doHighlight = () => {
                try {
                    if (!editor || !overlay) {
                        isHighlighting = false;
                        return;
                    }
                    
                    // Check if code changed or user is typing
                    if (editor.value !== code || isTyping) {
                        isHighlighting = false;
                        return;
                    }
                    
                    const highlighted = highlightSyntax(code);
                    
                    // Update overlay only if not typing
                    if (overlay && editor && editor.value === code && !isTyping) {
                        overlay.innerHTML = highlighted;
                        overlay.style.display = 'block';
                        syncSyntaxOverlay();
                    }
                } catch (error) {
                    // Silently fail
                } finally {
                    isHighlighting = false;
                }
            };
            
            // Use requestIdleCallback
            if (window.requestIdleCallback) {
                requestIdleCallback(doHighlight, { timeout: 2000 });
            } else {
                setTimeout(doHighlight, 100);
            }
        } catch (error) {
            isHighlighting = false;
        }
    }, 2000); // Very long delay - only when user stops typing for 2 seconds
}

// Highlight Syntax (Simplified for Performance)
function highlightSyntax(code) {
    if (!code) return '<div class="syntax-content"></div>';
    
    // Simple highlighting - escape HTML first
    let html = code
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    
    // Highlight comments first (highest priority)
    html = html.replace(/(\/\/[^\n]*|\/\*[\s\S]*?\*\/)/g, '<span class="syntax-comment">$1</span>');
    
    // Highlight strings (avoiding comments)
    html = html.replace(/(`[^`]*`|"[^"]*"|'[^']*')/g, '<span class="syntax-string">$1</span>');
    
    // Highlight numbers
    html = html.replace(/\b(\d+\.?\d*)\b/g, '<span class="syntax-number">$1</span>');
    
    // Highlight keywords
    const keywords = /\b(let|const|var|function|if|else|for|while|do|switch|case|break|continue|return|try|catch|finally|throw|new|this|class|extends|super|static|async|await|import|export|default|from|as|typeof|instanceof|in|of|true|false|null|undefined)\b/g;
    html = html.replace(keywords, '<span class="syntax-keyword">$1</span>');
    
    // Convert to HTML format
    html = html
        .replace(/\n/g, '<br>')
        .replace(/ /g, '&nbsp;')
        .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
    
    return '<div class="syntax-content">' + html + '</div>';
}

// Highlight a single line with proper token handling
function highlightLine(line) {
    if (line === '') return '&nbsp;';
    
    // Escape HTML
    const escaped = line
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    
    // Parse tokens in order
    const tokens = [];
    let processed = new Set();
    
    // Process in order: comments, strings, then others
    // 1. Comments (highest priority)
    const commentMatch = line.match(/(\/\/.*$|\/\*[\s\S]*?\*\/)/);
    if (commentMatch) {
        const start = commentMatch.index;
        const end = start + commentMatch[0].length;
        for (let i = start; i < end; i++) processed.add(i);
        tokens.push({ type: 'comment', start, end, text: commentMatch[0] });
    }
    
    // 2. Strings (avoid comments)
    const stringPatterns = [
        { regex: /`[^`]*`/g, quote: '`' },
        { regex: /"[^"]*"/g, quote: '"' },
        { regex: /'[^']*'/g, quote: "'" }
    ];
    
    stringPatterns.forEach(({ regex }) => {
        let match;
        regex.lastIndex = 0; // Reset
        while ((match = regex.exec(line)) !== null) {
            const start = match.index;
            const end = start + match[0].length;
            // Check if overlaps with comment
            const overlapsComment = tokens.some(t => 
                t.type === 'comment' && start < t.end && end > t.start
            );
            if (!overlapsComment) {
                // Check if already processed
                let alreadyProcessed = false;
                for (let i = start; i < end; i++) {
                    if (processed.has(i)) {
                        alreadyProcessed = true;
                        break;
                    }
                }
                if (!alreadyProcessed) {
                    for (let i = start; i < end; i++) processed.add(i);
                    tokens.push({ type: 'string', start, end, text: match[0] });
                }
            }
        }
    });
    
    // 3. Numbers (not in strings/comments)
    const numberRegex = /\b\d+\.?\d*\b/g;
    let numberMatch;
    while ((numberMatch = numberRegex.exec(line)) !== null) {
        const start = numberMatch.index;
        const end = start + numberMatch[0].length;
        // Check if in processed area
        let inProcessed = false;
        for (let i = start; i < end; i++) {
            if (processed.has(i)) {
                inProcessed = true;
                break;
            }
        }
        if (!inProcessed) {
            for (let i = start; i < end; i++) processed.add(i);
            tokens.push({ type: 'number', start, end, text: numberMatch[0] });
        }
    }
    
    // 4. Keywords (not in strings/comments/numbers)
    JS_KEYWORDS.forEach(keyword => {
        const keywordRegex = new RegExp(`\\b${keyword}\\b`, 'g');
        let keywordMatch;
        while ((keywordMatch = keywordRegex.exec(line)) !== null) {
            const start = keywordMatch.index;
            const end = start + keywordMatch[0].length;
            // Check if in processed area
            let inProcessed = false;
            for (let i = start; i < end; i++) {
                if (processed.has(i)) {
                    inProcessed = true;
                    break;
                }
            }
            if (!inProcessed) {
                for (let i = start; i < end; i++) processed.add(i);
                tokens.push({ type: 'keyword', start, end, text: keywordMatch[0] });
            }
        }
    });
    
    // 5. Functions (identifiers followed by paren)
    const functionRegex = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g;
    let functionMatch;
    while ((functionMatch = functionRegex.exec(line)) !== null) {
        const start = functionMatch.index;
        const end = start + functionMatch[1].length;
        const funcName = functionMatch[1];
        // Skip keywords
        if (JS_KEYWORDS.includes(funcName)) continue;
        // Check if in processed area
        let inProcessed = false;
        for (let i = start; i < end; i++) {
            if (processed.has(i)) {
                inProcessed = true;
                break;
            }
        }
        if (!inProcessed) {
            for (let i = start; i < end; i++) processed.add(i);
            tokens.push({ type: 'function', start, end, text: funcName });
        }
    }
    
    // Sort tokens by position
    tokens.sort((a, b) => a.start - b.start);
    
    // Build result
    let result = '';
    let lastIndex = 0;
    
    tokens.forEach(token => {
        // Text before token
        if (token.start > lastIndex) {
            result += escaped.substring(lastIndex, token.start);
        }
        // Token with class
        const tokenText = escaped.substring(token.start, token.end);
        result += `<span class="syntax-${token.type}">${tokenText}</span>`;
        lastIndex = token.end;
    });
    
    // Remaining text
    if (lastIndex < escaped.length) {
        result += escaped.substring(lastIndex);
    }
    
    // Handle empty result
    if (!result) result = escaped;
    
    // Replace spaces and tabs (preserve in HTML)
    result = result.replace(/ /g, '&nbsp;');
    result = result.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
    
    return result || '&nbsp;';
}

// Sync Syntax Overlay (Perfect Match)
function syncSyntaxOverlay() {
    const editor = document.getElementById('advancedCodeEditor');
    const overlay = document.getElementById('syntaxOverlay');
    
    if (!editor || !overlay) return;
    
    // Instant scroll sync
    overlay.scrollTop = editor.scrollTop;
    overlay.scrollLeft = editor.scrollLeft;
    
    // Perfect dimension match
    const editorRect = editor.getBoundingClientRect();
    const wrapperRect = editor.parentElement?.getBoundingClientRect();
    
    if (editorRect && wrapperRect) {
        overlay.style.width = editor.offsetWidth + 'px';
        overlay.style.height = editor.offsetHeight + 'px';
        overlay.style.padding = window.getComputedStyle(editor).padding;
        overlay.style.margin = window.getComputedStyle(editor).margin;
        overlay.style.boxSizing = window.getComputedStyle(editor).boxSizing;
    }
}

// Sync Editor Scroll (INSTANT - No Delays)
function syncEditorScroll() {
    const editor = document.getElementById('advancedCodeEditor');
    const lineNumbers = document.getElementById('editorLineNumbers');
    const overlay = document.getElementById('syntaxOverlay');
    
    if (!editor) return;
    
    // Instant sync - no requestAnimationFrame delay
    const scrollTop = editor.scrollTop;
    const scrollLeft = editor.scrollLeft;
    
    if (lineNumbers) {
        lineNumbers.scrollTop = scrollTop;
    }
    
    if (overlay) {
        overlay.scrollTop = scrollTop;
        overlay.scrollLeft = scrollLeft;
    }
}

// Handle Auto-Closing Brackets/Tags
function handleAutoClosing(e) {
    const editor = e.target;
    const key = e.key;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const textBefore = editor.value.substring(0, start);
    const textAfter = editor.value.substring(end);
    
    // Don't auto-close if there's a selection
    if (start !== end) return false;
    
    // Auto-closing pairs
    const pairs = {
        '{': '}',
        '[': ']',
        '(': ')',
        '"': '"',
        "'": "'",
        '`': '`'
    };
    
    if (pairs[key]) {
        // Check if we're inside a string or comment (don't auto-close)
        if (isInsideStringOrComment(textBefore, start)) {
            return false;
        }
        
        e.preventDefault();
        const closing = pairs[key];
        
        // Insert both opening and closing
        editor.value = textBefore + key + closing + textAfter;
        editor.selectionStart = editor.selectionEnd = start + 1;
        editorState.code = editor.value;
        updateLineNumbers();
        return true;
    }
    
    // Handle HTML tag auto-closing (<div> -> </div>)
    if (key === '>') {
        // Check if we're inside a string or comment (don't auto-close)
        if (isInsideStringOrComment(textBefore, start)) {
            return false;
        }
        
        // Check if this is an opening HTML tag (e.g., <div>, <span>, etc.)
        const tagMatch = textBefore.match(/<([a-zA-Z][a-zA-Z0-9]*)\s*[^>]*$/);
        if (tagMatch) {
            const tagName = tagMatch[1];
            // Don't auto-close self-closing tags or closing tags
            const selfClosingTags = ['br', 'hr', 'img', 'input', 'meta', 'link', 'area', 'base', 'col', 'embed', 'source', 'track', 'wbr'];
            if (selfClosingTags.includes(tagName.toLowerCase())) {
                return false; // Let normal > behavior happen
            }
            
            // Check if this is already a closing tag (starts with </)
            // Look for the tag position and check if there's </ before it
            const tagStartPos = textBefore.lastIndexOf('<' + tagName);
            if (tagStartPos > 0) {
                const charBeforeTag = textBefore.substring(tagStartPos - 2, tagStartPos);
                if (charBeforeTag === '</') {
                    return false; // Already a closing tag, don't auto-close
                }
            }
            
            // Auto-close the tag
            e.preventDefault();
            const closingTag = `</${tagName}>`;
            editor.value = textBefore + key + closingTag + textAfter;
            editor.selectionStart = editor.selectionEnd = start + 1;
            editorState.code = editor.value;
            updateLineNumbers();
            return true;
        }
    }
    
    return false;
}

// Handle Closing Bracket Skip (skip closing bracket if it's already there)
function handleClosingBracketSkip(e) {
    const editor = e.target;
    const key = e.key;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const textAfter = editor.value.substring(end);
    const textBefore = editor.value.substring(0, start);
    
    // Don't skip if there's a selection
    if (start !== end) return false;
    
    // Closing brackets that should be skipped
    const closingBrackets = ['}', ']', ')', '"', "'", '`'];
    
    if (closingBrackets.includes(key)) {
        // Check if next character is the same closing bracket
        if (textAfter.charAt(0) === key) {
            // Check if we're inside a string or comment (don't skip)
            if (isInsideStringOrComment(textBefore, start)) {
                return false;
            }
            
            // Skip the next character
            e.preventDefault();
            editor.selectionStart = editor.selectionEnd = start + 1;
            return true;
        }
    }
    
    // Handle HTML closing tag skip (</div> -> skip > if already there)
    if (key === '>') {
        // Check if we're inside a string or comment (don't skip)
        if (isInsideStringOrComment(textBefore, start)) {
            return false;
        }
        
        // Check if we're typing a closing tag (</tagName>)
        const closingTagMatch = textBefore.match(/<\/([a-zA-Z][a-zA-Z0-9]*)\s*$/);
        if (closingTagMatch) {
            // If next character is already >, skip it
            if (textAfter.charAt(0) === '>') {
                e.preventDefault();
                editor.selectionStart = editor.selectionEnd = start + 1;
                return true;
            }
        }
    }
    
    return false;
}

// Check if cursor is inside a string or comment
function isInsideStringOrComment(textBefore, cursorPos) {
    // Simple check: count quotes and comments
    const lastComment = textBefore.lastIndexOf('//');
    const lastLineStart = textBefore.lastIndexOf('\n');
    
    // If we're in a comment
    if (lastComment > lastLineStart) {
        return true;
    }
    
    // Check for strings
    const singleQuotes = (textBefore.match(/'/g) || []).length;
    const doubleQuotes = (textBefore.match(/"/g) || []).length;
    const backticks = (textBefore.match(/`/g) || []).length;
    
    // If odd number of quotes, we're inside a string
    if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0 || backticks % 2 !== 0) {
        const lastSingle = textBefore.lastIndexOf("'");
        const lastDouble = textBefore.lastIndexOf('"');
        const lastBacktick = textBefore.lastIndexOf('`');
        const lastQuote = Math.max(lastSingle, lastDouble, lastBacktick);
        
        if (lastQuote > lastLineStart && lastQuote < cursorPos - 1) {
            return true;
        }
    }
    
    return false;
}

// Handle Tab Key (Simplified - No Blocking Operations)
function handleTabKey(e) {
    if (e.key !== 'Tab') return;
    
    // Only handle Tab if it's not part of a modifier combination
    if (e.ctrlKey || e.metaKey || e.altKey) {
        return; // Let browser handle it
    }
    
    e.preventDefault();
    const editor = e.target;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    
    if (e.shiftKey) {
        // Shift+Tab: Remove indentation
        const lines = editor.value.split('\n');
        const startLine = editor.value.substring(0, start).split('\n').length - 1;
        const endLine = editor.value.substring(0, end).split('\n').length - 1;
        
        let removed = 0;
        for (let i = startLine; i <= endLine && i < lines.length; i++) {
            if (lines[i] && lines[i].startsWith('    ')) {
                lines[i] = lines[i].substring(4);
                if (i === startLine) removed = 4;
            } else if (lines[i] && lines[i].startsWith('\t')) {
                lines[i] = lines[i].substring(1);
                if (i === startLine) removed = 1;
            }
        }
        
        editor.value = lines.join('\n');
        editor.selectionStart = Math.max(0, start - removed);
        editor.selectionEnd = Math.max(0, end - ((endLine - startLine + 1) * removed));
    } else {
        // Tab: Add indentation (4 spaces)
        const indent = '    ';
        if (start === end) {
            // Single cursor - insert 4 spaces
            editor.value = editor.value.substring(0, start) + indent + editor.value.substring(end);
            editor.selectionStart = editor.selectionEnd = start + indent.length;
        } else {
            // Multiple lines selected - indent each line
            const lines = editor.value.split('\n');
            const startLine = editor.value.substring(0, start).split('\n').length - 1;
            const endLine = editor.value.substring(0, end).split('\n').length - 1;
            
            for (let i = startLine; i <= endLine && i < lines.length; i++) {
                if (lines[i] !== undefined) {
                    lines[i] = indent + lines[i];
                }
            }
            
            editor.value = lines.join('\n');
            editor.selectionStart = start + indent.length;
            editor.selectionEnd = end + ((endLine - startLine + 1) * indent.length);
        }
    }
    
    // Update state
    editorState.code = editor.value;
    
    // Update UI (non-blocking - async)
    updateLineNumbers();
    // Syntax highlighting will update automatically on next input event
    // Don't call updateSyntaxHighlighting() here to avoid blocking
}

// Enter key handling is now in setupEditorEvents - removed separate function to avoid duplication

// Setup Auto-complete - removed duplicate event listener
// Auto-complete is now handled in setupEditorEvents to avoid conflicts
function setupAutoComplete(editor) {
    // This function is kept for compatibility but does nothing
    // All auto-complete logic is in setupEditorEvents
    if (!editor) return;
}

// Update Auto-complete
function updateAutoComplete(e) {
    // Only update if event is provided and editor is focused
    if (!e || !e.target) {
        const editor = document.getElementById('advancedCodeEditor');
        if (!editor || document.activeElement !== editor) {
            const autocomplete = document.getElementById('autoCompleteList');
            if (autocomplete) {
                autocomplete.style.display = 'none';
                editorState.isAutoCompleteOpen = false;
            }
            return;
        }
    }
    
    const editor = e ? e.target : document.getElementById('advancedCodeEditor');
    const autocomplete = document.getElementById('autoCompleteList');
    
    if (!editor || !autocomplete || document.activeElement !== editor) {
        if (autocomplete) {
            autocomplete.style.display = 'none';
            editorState.isAutoCompleteOpen = false;
        }
        return;
    }
    
    // Don't show autocomplete if user is typing in a string or comment
    const cursorPos = editor.selectionStart;
    const textBefore = editor.value.substring(0, cursorPos);
    
    // Check if we're inside a string or comment (simplified check)
    const lastComment = textBefore.lastIndexOf('//');
    const lastLineStart = textBefore.lastIndexOf('\n');
    
    // Don't show autocomplete in comments
    if (lastComment > lastLineStart) {
        autocomplete.style.display = 'none';
        editorState.isAutoCompleteOpen = false;
        return;
    }
    
    // Simple check for strings (check if we're inside quotes)
    const singleQuotes = (textBefore.match(/'/g) || []).length;
    const doubleQuotes = (textBefore.match(/"/g) || []).length;
    const backticks = (textBefore.match(/`/g) || []).length;
    
    // If odd number of quotes, we're inside a string
    if (singleQuotes % 2 !== 0 || doubleQuotes % 2 !== 0 || backticks % 2 !== 0) {
        // Check if the last quote is before cursor
        const lastSingle = textBefore.lastIndexOf("'");
        const lastDouble = textBefore.lastIndexOf('"');
        const lastBacktick = textBefore.lastIndexOf('`');
        const lastQuote = Math.max(lastSingle, lastDouble, lastBacktick);
        
        if (lastQuote > lastLineStart && lastQuote < cursorPos - 1) {
            autocomplete.style.display = 'none';
            editorState.isAutoCompleteOpen = false;
            return;
        }
    }
    
    const wordMatch = textBefore.match(/([a-zA-Z_$][a-zA-Z0-9_$]*)$/);
    
    if (!wordMatch || wordMatch[1].length < 2) {
        autocomplete.style.display = 'none';
        editorState.isAutoCompleteOpen = false;
        return;
    }
    
    const word = wordMatch[1].toLowerCase();
    const suggestions = getSuggestions(word);
    
    if (suggestions.length === 0) {
        autocomplete.style.display = 'none';
        editorState.isAutoCompleteOpen = false;
        return;
    }
    
    editorState.suggestions = suggestions;
    editorState.isAutoCompleteOpen = true;
    
    // Display suggestions
    autocomplete.innerHTML = suggestions.map((suggestion, index) => 
        `<div class="autocomplete-item ${index === 0 ? 'selected' : ''}" data-index="${index}">
            <span class="autocomplete-label">${suggestion}</span>
        </div>`
    ).join('');
    
    // Position autocomplete near cursor (simplified positioning)
    try {
        const rect = editor.getBoundingClientRect();
        const scrollTop = editor.scrollTop || 0;
        const scrollLeft = editor.scrollLeft || 0;
        
        // Calculate cursor position
        const textBeforeCursor = editor.value.substring(0, editor.selectionStart);
        const lines = textBeforeCursor.split('\n');
        const currentLine = lines.length - 1;
        const currentColumn = lines[currentLine] ? lines[currentLine].length : 0;
        
        // Approximate character width (monospace font)
        const charWidth = 8.4;
        const lineHeight = 20;
        const padding = 15;
        
        // Calculate position
        const top = rect.top + padding + (currentLine * lineHeight) - scrollTop + lineHeight + 5;
        const left = rect.left + padding + (currentColumn * charWidth) - scrollLeft;
        
        autocomplete.style.top = Math.max(10, top) + 'px';
        autocomplete.style.left = Math.max(10, left) + 'px';
        autocomplete.style.display = 'block';
        
        // Add click handlers
        autocomplete.querySelectorAll('.autocomplete-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                insertSuggestion(suggestions[index]);
                autocomplete.style.display = 'none';
                editorState.isAutoCompleteOpen = false;
                editor.focus(); // Refocus editor after insertion
            });
        });
    } catch (error) {
        console.warn('Error positioning autocomplete:', error);
        autocomplete.style.display = 'none';
        editorState.isAutoCompleteOpen = false;
    }
}

// Get Suggestions
function getSuggestions(word) {
    const allSuggestions = [...JS_KEYWORDS, ...JS_BUILTINS];
    return allSuggestions
        .filter(s => s.toLowerCase().startsWith(word.toLowerCase()))
        .slice(0, 10);
}

// Handle Auto-complete Keys (Minimal and Non-Intrusive)
function handleAutoCompleteKeys(e) {
    const autocomplete = document.getElementById('autoCompleteList');
    
    if (!editorState.isAutoCompleteOpen || !autocomplete || autocomplete.style.display === 'none') {
        return false; // Not handling
    }
    
    // Only handle navigation keys when autocomplete is open
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        const selected = autocomplete.querySelector('.selected');
        const next = selected?.nextElementSibling || autocomplete.firstElementChild;
        if (selected) selected.classList.remove('selected');
        if (next) {
            next.classList.add('selected');
            next.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
        return true;
    } 
    
    if (e.key === 'ArrowUp') {
        e.preventDefault();
        const selected = autocomplete.querySelector('.selected');
        const prev = selected?.previousElementSibling || autocomplete.lastElementChild;
        if (selected) selected.classList.remove('selected');
        if (prev) {
            prev.classList.add('selected');
            prev.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
        return true;
    } 
    
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const selected = autocomplete.querySelector('.selected');
        if (selected && editorState.suggestions) {
            const index = parseInt(selected.dataset.index);
            if (editorState.suggestions[index]) {
                insertSuggestion(editorState.suggestions[index]);
                hideAutoComplete();
            }
        }
        return true;
    } 
    
    if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const selected = autocomplete.querySelector('.selected');
        if (selected && editorState.suggestions) {
            const index = parseInt(selected.dataset.index);
            if (editorState.suggestions[index]) {
                insertSuggestion(editorState.suggestions[index]);
                hideAutoComplete();
            }
        }
        return true;
    } 
    
    if (e.key === 'Escape') {
        hideAutoComplete();
        // Don't prevent default - let Escape work normally
        return false;
    }
    
    // For any other key, hide autocomplete but allow normal typing
    // Don't prevent default for any other keys
    hideAutoComplete();
    return false;
}

// Insert Suggestion (Simplified - No Interference)
function insertSuggestion(suggestion) {
    const editor = document.getElementById('advancedCodeEditor');
    if (!editor) return;
    
    // Preserve focus state
    const wasFocused = document.activeElement === editor;
    const cursorPos = editor.selectionStart;
    const textBefore = editor.value.substring(0, cursorPos);
    const wordMatch = textBefore.match(/([a-zA-Z_$][a-zA-Z0-9_$]*)$/);
    
    if (wordMatch) {
        const start = cursorPos - wordMatch[1].length;
        const textAfter = editor.value.substring(cursorPos);
        
        // Simple direct replacement
        editor.value = textBefore.substring(0, start) + suggestion + textAfter;
        
        // Set cursor position
        const newPos = start + suggestion.length;
        editor.selectionStart = editor.selectionEnd = newPos;
        
        // Update state
        editorState.code = editor.value;
        
        // Update line numbers (fast)
        updateLineNumbers();
        
        // Restore focus
        if (wasFocused) {
            requestAnimationFrame(() => {
                editor.focus();
                editor.setSelectionRange(newPos, newPos);
            });
        }
        
        // Don't call updateSyntaxHighlighting() - let it update naturally on input
    }
}

// Setup Error Detection - removed duplicate event listener
// Error detection is now handled in setupEditorEvents to avoid conflicts
function setupErrorDetection(editor) {
    // This function is kept for compatibility but does nothing
    // All error detection logic is in setupEditorEvents
    if (!editor) return;
}

// Detect Errors
function detectErrors() {
    const editor = document.getElementById('advancedCodeEditor');
    if (!editor) return;
    
    const code = editor.value;
    const errors = [];
    
    // Simple error detection
    try {
        // Check for unclosed braces
        const openBraces = (code.match(/{/g) || []).length;
        const closeBraces = (code.match(/}/g) || []).length;
        if (openBraces !== closeBraces) {
            errors.push({ type: 'error', message: 'Unclosed braces detected' });
        }
        
        // Check for unclosed parentheses
        const openParens = (code.match(/\(/g) || []).length;
        const closeParens = (code.match(/\)/g) || []).length;
        if (openParens !== closeParens) {
            errors.push({ type: 'error', message: 'Unclosed parentheses detected' });
        }
        
        // Check for unclosed strings
        const singleQuotes = (code.match(/'/g) || []).length;
        const doubleQuotes = (code.match(/"/g) || []).length;
        if (singleQuotes % 2 !== 0) {
            errors.push({ type: 'warning', message: 'Unclosed single quote' });
        }
        if (doubleQuotes % 2 !== 0) {
            errors.push({ type: 'warning', message: 'Unclosed double quote' });
        }
    } catch (e) {
        // Ignore parsing errors for now
    }
    
    editorState.errors = errors;
    displayErrors(errors);
}

// Display Errors
function displayErrors(errors) {
    const errorPanel = document.getElementById('errorPanel');
    if (!errorPanel) return;
    
    if (errors.length === 0) {
        errorPanel.style.display = 'none';
        return;
    }
    
    errorPanel.style.display = 'block';
    errorPanel.innerHTML = errors.map(error => 
        `<div class="error-item ${error.type}">
            <span class="error-icon">${error.type === 'error' ? '❌' : '⚠️'}</span>
            <span class="error-message">${error.message}</span>
        </div>`
    ).join('');
}

// Setup Keyboard Shortcuts - removed duplicate event listener
// Keyboard shortcuts are now handled in setupEditorEvents to avoid conflicts
function setupKeyboardShortcuts(editor) {
    // This function is kept for compatibility but does nothing
    // All keyboard shortcut logic is in setupEditorEvents
    if (!editor) return;
}

// Handle Shortcuts
function handleShortcuts(e) {
    const editor = e.target;
    
    // Only handle Ctrl/Cmd combinations, let all other keys work normally
    if (!e.ctrlKey && !e.metaKey) {
        return false; // Not a shortcut, allow normal behavior
    }
    
    // Ctrl+S or Cmd+S: Save (already handled by auto-save)
    if (e.key === 's') {
        e.preventDefault();
        // Auto-save is already enabled
        return true; // Handled
    }
    
    // Ctrl+/ or Cmd+/: Toggle comment
    if (e.key === '/') {
        e.preventDefault();
        toggleComment(editor);
        return true; // Handled
    }
    
    // Ctrl+Enter or Cmd+Enter: Run code
    if (e.key === 'Enter') {
        e.preventDefault();
        const runBtn = document.getElementById('runEditorBtn');
        if (runBtn) runBtn.click();
        return true; // Handled
    }
    
    // Ctrl+F or Cmd+F: Find (prevent browser find, but don't do anything yet)
    if (e.key === 'f') {
        e.preventDefault();
        // Find functionality can be added here
        return true; // Handled
    }
    
    return false; // Not a known shortcut
}

// Toggle Comment
function toggleComment(editor) {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selectedText = editor.value.substring(start, end);
    const lines = editor.value.split('\n');
    
    const startLine = editor.value.substring(0, start).split('\n').length - 1;
    const endLine = editor.value.substring(0, end).split('\n').length - 1;
    
    let allCommented = true;
    for (let i = startLine; i <= endLine; i++) {
        if (!lines[i].trim().startsWith('//')) {
            allCommented = false;
            break;
        }
    }
    
    for (let i = startLine; i <= endLine; i++) {
        if (allCommented) {
            // Uncomment
            lines[i] = lines[i].replace(/^(\s*)\/\/\s?/, '$1');
        } else {
            // Comment
            const indent = lines[i].match(/^\s*/)[0];
            lines[i] = indent + '// ' + lines[i].substring(indent.length);
        }
    }
    
    editor.value = lines.join('\n');
    editor.selectionStart = start;
    editor.selectionEnd = end + (allCommented ? -3 : 3) * (endLine - startLine + 1);
    
    updateLineNumbers();
    updateSyntaxHighlighting();
    editorState.code = editor.value;
}

// Update Cursor Position
function updateCursorPosition() {
    const editor = document.getElementById('advancedCodeEditor');
    if (!editor) return;
    
    editorState.cursorPosition = editor.selectionStart;
    editorState.selectionStart = editor.selectionStart;
    editorState.selectionEnd = editor.selectionEnd;
}

// Initialize on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEnhancedEditor);
} else {
    initEnhancedEditor();
}

// Add Code Snippets Support
const codeSnippets = {
    'for': 'for (let i = 0; i < length; i++) {\n    \n}',
    'forof': 'for (let item of array) {\n    \n}',
    'forin': 'for (let key in object) {\n    \n}',
    'if': 'if (condition) {\n    \n}',
    'ifelse': 'if (condition) {\n    \n} else {\n    \n}',
    'function': 'function name() {\n    \n}',
    'arrow': 'const name = () => {\n    \n}',
    'async': 'async function name() {\n    \n}',
    'try': 'try {\n    \n} catch (error) {\n    \n}',
    'class': 'class Name {\n    constructor() {\n        \n    }\n}'
};

// Insert Code Snippet
function insertSnippet(snippetKey) {
    const editor = document.getElementById('advancedCodeEditor');
    if (!editor) return;
    
    const snippet = codeSnippets[snippetKey];
    if (!snippet) return;
    
    const cursorPos = editor.selectionStart;
    const textBefore = editor.value.substring(0, cursorPos);
    const textAfter = editor.value.substring(cursorPos);
    
    editor.value = textBefore + snippet + textAfter;
    
    // Position cursor in snippet
    const snippetLines = snippet.split('\n');
    const firstLineWithPlaceholder = snippetLines.findIndex(line => line.includes('    '));
    if (firstLineWithPlaceholder >= 0) {
        const linesBefore = snippetLines.slice(0, firstLineWithPlaceholder).join('\n').length;
        const placeholderIndex = snippetLines[firstLineWithPlaceholder].indexOf('    ') + 4;
        editor.selectionStart = editor.selectionEnd = cursorPos + linesBefore + (firstLineWithPlaceholder > 0 ? 1 : 0) + placeholderIndex;
    } else {
        editor.selectionStart = editor.selectionEnd = cursorPos + snippet.length;
    }
    
    editor.focus();
    
    updateLineNumbers();
    updateSyntaxHighlighting();
    editorState.code = editor.value;
}

// Better code formatting function (VS Code style)
function formatJavaScriptCodeBetter(code) {
    if (!code) return '';
    
    // Split into lines
    let lines = code.split('\n');
    let formatted = [];
    let indent = 0;
    const indentSize = 4;
    
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        let trimmed = line.trim();
        
        // Skip empty lines but preserve structure
        if (trimmed === '') {
            formatted.push('');
            continue;
        }
        
        // Handle closing braces/brackets - decrease indent first
        if (trimmed.startsWith('}') || trimmed.startsWith(']') || trimmed.startsWith(')')) {
            indent = Math.max(0, indent - 1);
        }
        
        // Add line with proper indentation
        const indentedLine = ' '.repeat(indent * indentSize) + trimmed;
        formatted.push(indentedLine);
        
        // Handle opening braces/brackets - increase indent after
        if (trimmed.endsWith('{') || trimmed.endsWith('[')) {
            indent++;
        }
    }
    
    // Clean up multiple blank lines (max 2 consecutive)
    let cleaned = [];
    let blankCount = 0;
    for (let i = 0; i < formatted.length; i++) {
        if (formatted[i] === '') {
            blankCount++;
            if (blankCount <= 2) {
                cleaned.push('');
            }
        } else {
            blankCount = 0;
            cleaned.push(formatted[i]);
        }
    }
    
    return cleaned.join('\n').trim();
}

// Export functions for use in advanced-editor.js
window.enhancedEditor = {
    init: initEnhancedEditor,
    updateLineNumbers,
    updateSyntaxHighlighting,
    updateAutoComplete,
    detectErrors,
    formatCode: formatJavaScriptCodeBetter,
    syncEditorScroll,
    insertSnippet
};

