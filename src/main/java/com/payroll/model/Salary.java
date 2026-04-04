package com.payroll.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;

public class Salary {

    private String salaryId;
    private String employeeId;
    private YearMonth month;

    private BigDecimal basicSalary;
    private BigDecimal houseRentAllowance;
    private BigDecimal dearnessAllowance;
    private BigDecimal specialAllowance;
    private BigDecimal bonus;
    private BigDecimal overtimePay;
    private BigDecimal totalEarnings;

    private BigDecimal providentFund;
    private BigDecimal employeeStateInsurance;
    private BigDecimal incomeTax;
    private BigDecimal professionalTax;
    private BigDecimal otherDeductions;
    private BigDecimal totalDeductions;

    private BigDecimal netSalary;

    private String status;
    private int workingDays;
    private int presentDays;
    private int paidLeaveDays;
    private int absentDays;
    private int halfDays;

    private LocalDateTime calculatedAt;
    private LocalDateTime approvedAt;

    public Salary() {
        this.status = "DRAFT";
        this.basicSalary = BigDecimal.ZERO;
        this.houseRentAllowance = BigDecimal.ZERO;
        this.dearnessAllowance = BigDecimal.ZERO;
        this.specialAllowance = BigDecimal.ZERO;
        this.bonus = BigDecimal.ZERO;
        this.overtimePay = BigDecimal.ZERO;
        this.totalEarnings = BigDecimal.ZERO;
        this.providentFund = BigDecimal.ZERO;
        this.employeeStateInsurance = BigDecimal.ZERO;
        this.incomeTax = BigDecimal.ZERO;
        this.professionalTax = BigDecimal.ZERO;
        this.otherDeductions = BigDecimal.ZERO;
        this.totalDeductions = BigDecimal.ZERO;
        this.netSalary = BigDecimal.ZERO;
        this.calculatedAt = LocalDateTime.now();
    }

    public String getSalaryId() { return salaryId; }
    public void setSalaryId(String salaryId) { this.salaryId = salaryId; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public YearMonth getMonth() { return month; }
    public void setMonth(YearMonth month) { this.month = month; }

    public BigDecimal getBasicSalary() { return basicSalary; }
    public void setBasicSalary(BigDecimal basicSalary) { this.basicSalary = basicSalary; }

    public BigDecimal getHouseRentAllowance() { return houseRentAllowance; }
    public void setHouseRentAllowance(BigDecimal houseRentAllowance) { this.houseRentAllowance = houseRentAllowance; }

    public BigDecimal getDearnessAllowance() { return dearnessAllowance; }
    public void setDearnessAllowance(BigDecimal dearnessAllowance) { this.dearnessAllowance = dearnessAllowance; }

    public BigDecimal getSpecialAllowance() { return specialAllowance; }
    public void setSpecialAllowance(BigDecimal specialAllowance) { this.specialAllowance = specialAllowance; }

    public BigDecimal getBonus() { return bonus; }
    public void setBonus(BigDecimal bonus) { this.bonus = bonus; }

    public BigDecimal getOvertimePay() { return overtimePay; }
    public void setOvertimePay(BigDecimal overtimePay) { this.overtimePay = overtimePay; }

    public BigDecimal getTotalEarnings() { return totalEarnings; }
    public void setTotalEarnings(BigDecimal totalEarnings) { this.totalEarnings = totalEarnings; }

    public BigDecimal getProvidentFund() { return providentFund; }
    public void setProvidentFund(BigDecimal providentFund) { this.providentFund = providentFund; }

    public BigDecimal getEmployeeStateInsurance() { return employeeStateInsurance; }
    public void setEmployeeStateInsurance(BigDecimal employeeStateInsurance) { this.employeeStateInsurance = employeeStateInsurance; }

    public BigDecimal getIncomeTax() { return incomeTax; }
    public void setIncomeTax(BigDecimal incomeTax) { this.incomeTax = incomeTax; }

    public BigDecimal getProfessionalTax() { return professionalTax; }
    public void setProfessionalTax(BigDecimal professionalTax) { this.professionalTax = professionalTax; }

    public BigDecimal getOtherDeductions() { return otherDeductions; }
    public void setOtherDeductions(BigDecimal otherDeductions) { this.otherDeductions = otherDeductions; }

    public BigDecimal getTotalDeductions() { return totalDeductions; }
    public void setTotalDeductions(BigDecimal totalDeductions) { this.totalDeductions = totalDeductions; }

    public BigDecimal getNetSalary() { return netSalary; }
    public void setNetSalary(BigDecimal netSalary) { this.netSalary = netSalary; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public int getWorkingDays() { return workingDays; }
    public void setWorkingDays(int workingDays) { this.workingDays = workingDays; }

    public int getPresentDays() { return presentDays; }
    public void setPresentDays(int presentDays) { this.presentDays = presentDays; }

    public int getPaidLeaveDays() { return paidLeaveDays; }
    public void setPaidLeaveDays(int paidLeaveDays) { this.paidLeaveDays = paidLeaveDays; }

    public int getAbsentDays() { return absentDays; }
    public void setAbsentDays(int absentDays) { this.absentDays = absentDays; }

    public int getHalfDays() { return halfDays; }
    public void setHalfDays(int halfDays) { this.halfDays = halfDays; }

    public LocalDateTime getCalculatedAt() { return calculatedAt; }
    public void setCalculatedAt(LocalDateTime calculatedAt) { this.calculatedAt = calculatedAt; }

    public LocalDateTime getApprovedAt() { return approvedAt; }
    public void setApprovedAt(LocalDateTime approvedAt) { this.approvedAt = approvedAt; }

    @Override
    public String toString() {
        return String.format("Salary{empId='%s', month=%s, net=Rs.%.2f, status='%s'}",
                employeeId, month, netSalary, status);
    }
}
