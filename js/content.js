/**
 * AT Helper Stats - Content Script
 */

let isPercentMode = false;

function getPercent(current, previous) {
  if (previous === null) return 100;
  if (previous === 0) return current > 0 ? 100 : 0;
  return (current / previous) * 100;
}

function applyHighlighting() {
  const gridContent = document.querySelector('.k-grid-content table tbody');
  if (!gridContent) return;

  const rows = Array.from(gridContent.querySelectorAll('tr'));
  if (rows.length < 1) return;

  // Определяем количество столбцов
  const colCount = rows[0].cells.length;

  for (let j = 0; j < colCount; j++) {
    let prevValue = null;

    for (let i = 0; i < rows.length; i++) {
      const cell = rows[i].cells[j];
      
      // Сохраняем оригинальное значение при первом проходе
      let origText = cell.getAttribute('data-orig-text');
      if (!origText) {
        origText = cell.textContent.trim();
        cell.setAttribute('data-orig-text', origText);
      }
      
      const text = origText.replace(/\s/g, '');
      const currentValue = parseFloat(text);

      if (!isNaN(currentValue)) {
        if (prevValue !== null) {
          // Очищаем старые классы
          cell.classList.remove('at-stat-up', 'at-stat-down');

          if (currentValue > prevValue) {
            cell.classList.add('at-stat-up');
          } else {
            cell.classList.add('at-stat-down');
          }
        } else {
          // Для первой строки (если нет предыдущей) можно задать дефолтный цвет или оставить как есть
          cell.classList.add('at-stat-down');
        }
        
        if (isPercentMode) {
          const percent = getPercent(currentValue, prevValue);
          const newText = Math.round(percent) + '%';
          if (cell.textContent !== newText) {
            cell.textContent = newText;
          }
        } else {
          if (cell.textContent !== origText) {
            cell.textContent = origText;
          }
        }
        
        prevValue = currentValue;
      }
    }
  }
}

// Функция для инициализации масштабирования (синхронизация высоты заблокированных колонок)
function initResizer() {
  const grid = document.getElementById('grid');
  if (!grid) return;

  const observer = new ResizeObserver(entries => {
    for (let entry of entries) {
      const newHeight = entry.contentRect.height;
      const headerHeight = grid.querySelector('.k-grid-header')?.offsetHeight || 40;
      const contentHeight = newHeight - headerHeight;

      const lockedContent = grid.querySelector('.k-grid-content-locked');
      const scrollContent = grid.querySelector('.k-grid-content');

      if (lockedContent) lockedContent.style.height = contentHeight + 'px';
      if (scrollContent) scrollContent.style.height = contentHeight + 'px';
    }
  });

  observer.observe(grid);
}

// Отслеживание изменений в таблице (Kendo Grid часто перерисовывается)
function observeTableChanges() {
  const targetNode = document.getElementById('grid');
  if (!targetNode) return;

  const config = { childList: true, subtree: true };
  const callback = function(mutationsList, observer) {
    // Чтобы не вызывать слишком часто, используем debounce или проверяем наличие изменений в данных
    applyHighlighting();
  };

  const observer = new MutationObserver(callback);
  observer.observe(targetNode, config);
}

function createToggleButton() {
  if (document.getElementById('at-percent-toggle')) return;
  const grid = document.getElementById('grid');
  if (!grid) return;

  const btn = document.createElement('button');
  btn.id = 'at-percent-toggle';
  btn.textContent = 'Режим: Проценты';
  btn.style.cssText = `
    margin-bottom: 10px;
    padding: 8px 15px;
    cursor: pointer;
    background-color: #f0f0f0;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-weight: bold;
    transition: background-color 0.2s;
  `;
  
  btn.addEventListener('click', () => {
    isPercentMode = !isPercentMode;
    if (isPercentMode) {
      btn.textContent = 'Режим: Абсолютные';
      btn.style.backgroundColor = '#d0e0ff';
    } else {
      btn.textContent = 'Режим: Проценты';
      btn.style.backgroundColor = '#f0f0f0';
    }
    applyHighlighting();
  });

  grid.parentNode.insertBefore(btn, grid);
}

// Запуск при загрузке
function init() {
  console.log('AT Helper Stats initialized');
  createToggleButton();
  applyHighlighting();
  initResizer();
  observeTableChanges();
}

// Ждем появления таблицы
const checkExist = setInterval(function() {
  if (document.getElementById('grid')) {
    init();
    clearInterval(checkExist);
  }
}, 500);
