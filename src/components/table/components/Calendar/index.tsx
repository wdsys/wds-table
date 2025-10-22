// @ts-nocheck
/* eslint-disable react/button-has-type */
import React from 'react';
import Calendar from 'react-calendar';
import styles from './index.module.less';
import 'react-calendar/dist/Calendar.css';

export default function DatePicker({ value, onReset, onOk }) {
  const [selectedDate, setSelectedDate] = React.useState(null);
  const handleConfirm = () => {
    onOk(selectedDate);
  };

  const handleReset = (v) => {
    onReset(undefined);
  };

  React.useEffect(() => {
    if (value) {
      setSelectedDate(new Date(value));
    }
  }, [value]);

  return (
    <div className={styles.datePicker}>
      <Calendar
        value={selectedDate}
        locale='en-EN'
        // formatDay={(locale, date) => date.getDate()}
        // formatShortWeekday={(locale, date) => ['日', '一', '二', '三', '四', '五', '六'][date.getDay()]}
        onChange={(v) => { setSelectedDate(v); }}
      />
      <div className={styles.footer}>
        <button onClick={handleReset} className={styles.resetButton}>
          Clear
        </button>
        <button onClick={handleConfirm} className={styles.confirmButton}>
          OK
        </button>
      </div>
    </div>
  );
}
