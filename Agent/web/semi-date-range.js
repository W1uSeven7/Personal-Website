const PRESENT_TEXT = "至今";
const RANGE_SEPARATOR = " - ";

function normalizeMonthValue(value) {
  const text = (value || "").toString().trim();
  if (!text) return "";
  if (text === PRESENT_TEXT) return PRESENT_TEXT;

  const match = text.match(/^(\d{4})[.\-/年](\d{1,2})(?:月)?$/);
  if (!match) return text;

  const month = Number(match[2]);
  if (month < 1 || month > 12) return text;
  return `${match[1]}.${String(month).padStart(2, "0")}`;
}

function monthToDate(value) {
  const normalized = normalizeMonthValue(value);
  const match = normalized.match(/^(\d{4})\.(\d{2})$/);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, 1);
}

function dateToMonth(value) {
  if (typeof value === "string") return normalizeMonthValue(value);
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) return "";
  return `${value.getFullYear()}.${String(value.getMonth() + 1).padStart(2, "0")}`;
}

function normalizeDateString(dateString, dateValue) {
  if (Array.isArray(dateString)) {
    return [normalizeMonthValue(dateString[0]), normalizeMonthValue(dateString[1])];
  }

  if (typeof dateString === "string" && dateString.trim()) {
    const parts = dateString.split(RANGE_SEPARATOR);
    if (parts.length === 2) {
      return [normalizeMonthValue(parts[0]), normalizeMonthValue(parts[1])];
    }
  }

  if (Array.isArray(dateValue)) {
    return [dateToMonth(dateValue[0]), dateToMonth(dateValue[1])];
  }

  return ["", ""];
}

function monthToNumber(value) {
  const normalized = normalizeMonthValue(value);
  if (!normalized || normalized === PRESENT_TEXT) return null;

  const match = normalized.match(/^(\d{4})\.(\d{2})$/);
  if (!match) return null;
  return Number(match[1]) * 12 + Number(match[2]);
}

function isEndBeforeStart(start, end) {
  const startNumber = monthToNumber(start);
  const endNumber = monthToNumber(end);
  return startNumber !== null && endNumber !== null && endNumber < startNumber;
}

function getHiddenInput(form, name) {
  return form?.elements?.[name] || null;
}

function setHiddenValue(form, name, value) {
  const input = getHiddenInput(form, name);
  if (!input) return;
  input.value = value;
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function buildRangeValue(start, end) {
  const startDate = monthToDate(start);
  const endDate = end === PRESENT_TEXT ? null : monthToDate(end);
  return [startDate, endDate].filter(Boolean);
}

async function mountSemiDatePickers() {
  const hosts = Array.from(document.querySelectorAll("[data-semi-month-range]"));
  if (hosts.length === 0) return;

  hosts.forEach((host) => {
    host.innerHTML = `<div class="semi-range-loading">正在加载时间选择器...</div>`;
  });

  try {
    const [ReactModule, ReactDomModule, SemiModule] = await Promise.all([
      import("https://esm.sh/react@18.3.1"),
      import("https://esm.sh/react-dom@18.3.1/client"),
      import("https://esm.sh/@douyinfe/semi-ui@2.81.0?bundle&deps=react@18.3.1,react-dom@18.3.1"),
    ]);

    const React = ReactModule.default || ReactModule;
    const { useEffect, useMemo, useState } = ReactModule;
    const { createRoot } = ReactDomModule;
    const { Button, DatePicker, Toast } = SemiModule;
    window.SemiToast = Toast;

    function SemiMonthRange({ host }) {
      const form = host.closest("form");
      const startName = host.dataset.startName;
      const endName = host.dataset.endName;
      const defaultStart = normalizeMonthValue(host.dataset.startValue);
      const defaultEnd = normalizeMonthValue(host.dataset.endValue);

      const initialRange = useMemo(
        () => buildRangeValue(defaultStart, defaultEnd),
        [defaultStart, defaultEnd]
      );

      const [range, setRange] = useState(initialRange);
      const [start, setStart] = useState(defaultStart);
      const [end, setEnd] = useState(defaultEnd);
      const [isPresent, setIsPresent] = useState(defaultEnd === PRESENT_TEXT);

      function syncValues(nextStart, nextEnd) {
        setStart(nextStart);
        setEnd(nextEnd);
        setHiddenValue(form, startName, nextStart);
        setHiddenValue(form, endName, nextEnd);
      }

      function handleRangeChange(dateValue, dateString) {
        const [nextStart, nextEnd] = normalizeDateString(dateString, dateValue);
        const nextRange = Array.isArray(dateValue) ? dateValue.filter(Boolean) : [];

        setRange(nextRange);
        setIsPresent(false);
        syncValues(nextStart, nextEnd);

        if (isEndBeforeStart(nextStart, nextEnd)) {
          Toast.error("结束时间不能早于开始时间");
        }
      }

      function handlePresentClick() {
        const nextStart = start || dateToMonth(range?.[0]);
        if (!nextStart) {
          Toast.warning("请先选择开始时间");
          return;
        }

        setIsPresent(true);
        setRange(buildRangeValue(nextStart, PRESENT_TEXT));
        syncValues(nextStart, PRESENT_TEXT);
      }

      function handleClear() {
        setRange([]);
        setIsPresent(false);
        syncValues("", "");
      }

      useEffect(() => {
        function handleReset() {
          window.setTimeout(() => {
            const resetStart = normalizeMonthValue(defaultStart);
            const resetEnd = normalizeMonthValue(defaultEnd);
            setRange(buildRangeValue(resetStart, resetEnd));
            setIsPresent(resetEnd === PRESENT_TEXT);
            syncValues(resetStart, resetEnd);
          }, 0);
        }

        form?.addEventListener("reset", handleReset);
        syncValues(defaultStart, defaultEnd);

        return () => form?.removeEventListener("reset", handleReset);
      }, []);

      return React.createElement(
        "div",
        { className: "semi-range-wrapper" },
        React.createElement(DatePicker, {
          className: "semi-month-range-picker",
          type: "monthRange",
          value: range,
          format: "yyyy.MM",
          rangeSeparator: RANGE_SEPARATOR,
          inputReadOnly: true,
          placeholder: ["请选择开始时间", "请选择结束时间"],
          onChange: handleRangeChange,
          onClear: handleClear,
          style: { width: "100%" },
          position: "bottomLeft",
          bottomSlot: React.createElement(
            "div",
            { className: "semi-present-slot" },
            React.createElement(
              Button,
              {
                className: isPresent ? "semi-present-button is-active" : "semi-present-button",
                theme: isPresent ? "solid" : "light",
                type: isPresent ? "primary" : "tertiary",
                onClick: handlePresentClick,
              },
              PRESENT_TEXT
            )
          ),
        })
      );
    }

    hosts.forEach((host) => {
      host.innerHTML = "";
      createRoot(host).render(React.createElement(SemiMonthRange, { host }));
    });
  } catch (error) {
    console.error("Semi DatePicker 加载失败。", error);
    hosts.forEach((host) => {
      host.innerHTML = `<div class="semi-range-error">时间选择器加载失败，请刷新页面或检查网络后重试。</div>`;
    });
  }
}

mountSemiDatePickers();
