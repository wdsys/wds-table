// @ts-nocheck
/* eslint-disable no-plusplus */
/* eslint-disable react/button-has-type */
/* eslint-disable jsx-a11y/control-has-associated-label */

import React, { useState } from 'react';
import {
  LeftOutlined, RightOutlined, DoubleLeftOutlined, DoubleRightOutlined,
} from '@ant-design/icons';
import styles from './index.module.less';

export default function DatePicker({ value, onReset, onOk }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [tempDate, setTempDate] = useState(new Date());

  const daysInMonth = new Date(tempDate.getFullYear(), tempDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(tempDate.getFullYear(), tempDate.getMonth(), 1).getDay();

  const prevMonth = () => {
    setTempDate(new Date(tempDate.getFullYear(), tempDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setTempDate(new Date(tempDate.getFullYear(), tempDate.getMonth() + 1, 1));
  };

  const prevYear = () => {
    setTempDate(new Date(tempDate.getFullYear() - 1, tempDate.getMonth(), 1));
  };

  const nextYear = () => {
    setTempDate(new Date(tempDate.getFullYear() + 1, tempDate.getMonth(), 1));
  };

  const handleDateClick = (day) => {
    setSelectedDate(new Date(tempDate.getFullYear(), tempDate.getMonth(), day));
  };

  const handleConfirm = () => {
    setCurrentDate(tempDate);
    if (selectedDate) {
      const date = new Date(
        tempDate.getFullYear(),
        tempDate.getMonth(),
        selectedDate.getDate(),
      );
      setSelectedDate(date.toLocaleDateString());
      onOk(date);
    }
  };

  const handleReset = () => {
    setTempDate(currentDate);
    setSelectedDate(null);
    onReset(undefined);
  };

  const renderDays = () => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className={styles.emptyDay} />);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const isToday = new Date().toDateString() === new Date(
        tempDate.getFullYear(),
        tempDate.getMonth(),
        i,
      ).toDateString();
      const isSelected = selectedDate?.toDateString() === new Date(
        tempDate.getFullYear(),
        tempDate.getMonth(),
        i,
      ).toDateString();
      days.push(
        <div
          key={i}
          className={`${styles.day} ${isToday ? styles.today : ''} ${isSelected ? styles.selected : ''}`}
          onClick={() => handleDateClick(i)}
        >
          {i}
        </div>,
      );
    }
    return days;
  };

  React.useEffect(() => {
    if (value) {
      setSelectedDate(new Date(value));
    }
  }, [value]);

  return (
    <div className={styles.datePicker}>
      <div className={styles.header}>
        <div className={styles.leftControl}>
          <button onClick={prevYear} className={styles.navButton} aria-label="Previous year">
            <DoubleLeftOutlined style={{ fontSize: 14 }} />
          </button>
          <button onClick={prevMonth} className={styles.navButton} aria-label="Previous month">
            <LeftOutlined style={{ fontSize: 14 }} />
          </button>
        </div>
        <div className={styles.yearMonthText}>
          <span style={{ marginRight: '8px' }}>
            {tempDate.getFullYear()}
            年
          </span>
          <span>{tempDate.toLocaleString('default', { month: 'long' })}</span>
        </div>
        <div className={styles.rightControl}>
          <div>
            <button onClick={nextMonth} className={styles.navButton} aria-label="Next month">
              <RightOutlined style={{ fontSize: 14 }} />
            </button>
            <button onClick={nextYear} className={styles.navButton} aria-label="Next year">
              <DoubleRightOutlined style={{ fontSize: 14 }} />
            </button>
          </div>
        </div>
      </div>
      <div className={styles.weekdays}>
        {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
          <div key={day} className={styles.weekday}>
            {day}
          </div>
        ))}
      </div>
      <div className={styles.days}>{renderDays()}</div>
      <div className={styles.footer}>
        <button onClick={handleReset} className={styles.resetButton}>
          清空
        </button>
        <button onClick={handleConfirm} className={styles.confirmButton}>
          确定
        </button>
      </div>
    </div>
  );
}
