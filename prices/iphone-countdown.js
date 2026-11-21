'use strict';

const countdown = document.querySelector('[data-iphone-deadline]');
if (countdown) {
  const deadline = Date.parse(countdown.dataset.iphoneDeadline);
  const units = { weeks: 10080, days: 1440, hours: 60, minutes: 1 };
  const fields = Object.entries(units).map(([name, minutes]) => ({
    value: countdown.querySelector(`[data-unit="${name}"]`),
    minutes,
  }));
  const format = new Intl.NumberFormat('ar-u-nu-arab', { useGrouping: false });
  const timer = countdown.querySelector('output');
  const finished = countdown.querySelector('[data-countdown-finished]');

  const update = () => {
    let remaining = Math.ceil((deadline - Date.now()) / 60000);
    if (remaining <= 0) {
      timer.hidden = true;
      finished.hidden = false;
      return false;
    }
    for (const field of fields) {
      const amount = Math.floor(remaining / field.minutes);
      const text = format.format(amount);
      if (field.value.textContent !== text) field.value.textContent = text;
      remaining %= field.minutes;
    }
    timer.hidden = false;
    return true;
  };

  if (Number.isFinite(deadline) && update()) {
    const refresh = window.setInterval(() => {
      if (!update()) window.clearInterval(refresh);
    }, 1000);
  }
}
