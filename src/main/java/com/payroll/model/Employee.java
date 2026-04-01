package com.payroll.model;

import java.math.BigDecimal;
import java.time.LocalDate;

public class Employee {

    private String employeeId;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private BigDecimal baseSalary;
    private String department;
    private String position;
    private LocalDate dateOfJoining;
    private String bankAccountNumber;
    private String ifscCode;
    private String panNumber;
    private String status;

    public Employee() {
        this.status = "ACTIVE";
    }

    public Employee(String employeeId, String firstName, String lastName, String email,
                    BigDecimal baseSalary, String department) {
        this.employeeId = employeeId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.baseSalary = baseSalary;
        this.department = department;
        this.status = "ACTIVE";
        this.dateOfJoining = LocalDate.now();
    }

    public Employee(String employeeId, String firstName, String lastName, String email,
                    String phone, BigDecimal baseSalary, String department, String position,
                    LocalDate dateOfJoining, String bankAccountNumber) {
        this.employeeId = employeeId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.phone = phone;
        this.baseSalary = baseSalary;
        this.department = department;
        this.position = position;
        this.dateOfJoining = dateOfJoining;
        this.bankAccountNumber = bankAccountNumber;
        this.status = "ACTIVE";
    }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public BigDecimal getBaseSalary() { return baseSalary; }
    public void setBaseSalary(BigDecimal baseSalary) { this.baseSalary = baseSalary; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getPosition() { return position; }
    public void setPosition(String position) { this.position = position; }

    public LocalDate getDateOfJoining() { return dateOfJoining; }
    public void setDateOfJoining(LocalDate dateOfJoining) { this.dateOfJoining = dateOfJoining; }

    public String getBankAccountNumber() { return bankAccountNumber; }
    public void setBankAccountNumber(String bankAccountNumber) { this.bankAccountNumber = bankAccountNumber; }

    public String getIfscCode() { return ifscCode; }
    public void setIfscCode(String ifscCode) { this.ifscCode = ifscCode; }

    public String getPanNumber() { return panNumber; }
    public void setPanNumber(String panNumber) { this.panNumber = panNumber; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getFullName() {
        return firstName + " " + lastName;
    }

    @Override
    public String toString() {
        return String.format("[%s] %s %s | Dept: %s | Position: %s | Salary: Rs.%.2f | Status: %s",
                employeeId, firstName, lastName, department,
                position != null ? position : "N/A",
                baseSalary != null ? baseSalary : BigDecimal.ZERO,
                status);
    }
}
