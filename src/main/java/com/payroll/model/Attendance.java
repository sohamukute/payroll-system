package com.payroll.model;

import java.time.LocalDate;

public class Attendance {

    private String attendanceId;
    private String employeeId;
    private LocalDate date;
    private String status;
    private double hoursWorked;

    public Attendance() {}

    public Attendance(String attendanceId, String employeeId, LocalDate date, String status) {
        this.attendanceId = attendanceId;
        this.employeeId = employeeId;
        this.date = date;
        this.status = status;
        if (status.equals("PRESENT")) {
            this.hoursWorked = 8.0;
        } else if (status.equals("HALF_DAY")) {
            this.hoursWorked = 4.0;
        } else {
            this.hoursWorked = 0.0;
        }
    }

    public Attendance(String attendanceId, String employeeId, LocalDate date, String status, double hoursWorked) {
        this.attendanceId = attendanceId;
        this.employeeId = employeeId;
        this.date = date;
        this.status = status;
        this.hoursWorked = hoursWorked;
    }

    public String getAttendanceId() { return attendanceId; }
    public void setAttendanceId(String attendanceId) { this.attendanceId = attendanceId; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public double getHoursWorked() { return hoursWorked; }
    public void setHoursWorked(double hoursWorked) { this.hoursWorked = hoursWorked; }

    public boolean isCountableDay() {
        return status.equals("PRESENT") || status.equals("PAID_LEAVE") || status.equals("HALF_DAY");
    }

    public double getDayFraction() {
        if (status.equals("PRESENT") || status.equals("PAID_LEAVE")) return 1.0;
        if (status.equals("HALF_DAY")) return 0.5;
        return 0.0;
    }

    @Override
    public String toString() {
        return String.format("Attendance{empId='%s', date=%s, status='%s', hours=%.1f}",
                employeeId, date, status, hoursWorked);
    }
}
