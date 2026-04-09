package com.payroll.service;

import com.payroll.model.Attendance;
import com.payroll.model.Employee;
import com.payroll.model.Salary;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

public class PayrollCalculationService {

    private static final BigDecimal HRA_PERCENT = new BigDecimal("0.40");
    private static final BigDecimal DA_PERCENT = new BigDecimal("0.50");
    private static final BigDecimal SPECIAL_ALLOWANCE_PERCENT = new BigDecimal("0.10");
    private static final BigDecimal PF_PERCENT = new BigDecimal("0.12");
    private static final BigDecimal ESI_PERCENT = new BigDecimal("0.0075");
    private static final BigDecimal ESI_THRESHOLD = new BigDecimal("21000");
    private static final BigDecimal PROFESSIONAL_TAX = new BigDecimal("200");

    private AtomicInteger idCounter = new AtomicInteger(1);

    public Salary calculateSalary(Employee employee, YearMonth month, List<Attendance> attendanceRecords) {
        if (employee == null) throw new IllegalArgumentException("Employee cannot be null");
        if (month == null) throw new IllegalArgumentException("Month cannot be null");
        if (attendanceRecords == null || attendanceRecords.isEmpty()) {
            throw new IllegalArgumentException("No attendance records found for " + employee.getEmployeeId() + " in " + month);
        }

        Salary salary = new Salary();
        salary.setSalaryId("SAL" + String.format("%04d", idCounter.getAndIncrement()));
        salary.setEmployeeId(employee.getEmployeeId());
        salary.setMonth(month);
        salary.setCalculatedAt(LocalDateTime.now());

        int totalDaysInMonth = month.lengthOfMonth();
        int presentDays = 0;
        int paidLeaveDays = 0;
        int absentDays = 0;
        int halfDays = 0;
        double effectiveDays = 0.0;

        for (Attendance a : attendanceRecords) {
            switch (a.getStatus()) {
                case "PRESENT":
                    presentDays++;
                    effectiveDays += 1.0;
                    break;
                case "PAID_LEAVE":
                    paidLeaveDays++;
                    effectiveDays += 1.0;
                    break;
                case "HALF_DAY":
                    halfDays++;
                    effectiveDays += 0.5;
                    break;
                case "ABSENT":
                    absentDays++;
                    break;
                default:
                    break;
            }
        }

        salary.setPresentDays(presentDays);
        salary.setPaidLeaveDays(paidLeaveDays);
        salary.setAbsentDays(absentDays);
        salary.setHalfDays(halfDays);
        salary.setWorkingDays((int) Math.round(effectiveDays));

        BigDecimal baseSalary = employee.getBaseSalary();
        BigDecimal perDaySalary = baseSalary.divide(BigDecimal.valueOf(totalDaysInMonth), 10, RoundingMode.HALF_UP);
        BigDecimal basicSalary = perDaySalary.multiply(BigDecimal.valueOf(effectiveDays)).setScale(2, RoundingMode.HALF_UP);

        BigDecimal hra = basicSalary.multiply(HRA_PERCENT).setScale(2, RoundingMode.HALF_UP);
        BigDecimal da = basicSalary.multiply(DA_PERCENT).setScale(2, RoundingMode.HALF_UP);
        BigDecimal specialAllowance = basicSalary.multiply(SPECIAL_ALLOWANCE_PERCENT).setScale(2, RoundingMode.HALF_UP);

        BigDecimal totalEarnings = basicSalary.add(hra).add(da).add(specialAllowance);

        salary.setBasicSalary(basicSalary);
        salary.setHouseRentAllowance(hra);
        salary.setDearnessAllowance(da);
        salary.setSpecialAllowance(specialAllowance);
        salary.setTotalEarnings(totalEarnings);

        BigDecimal pf = basicSalary.add(da).multiply(PF_PERCENT).setScale(2, RoundingMode.HALF_UP);

        BigDecimal esi = BigDecimal.ZERO;
        if (totalEarnings.compareTo(ESI_THRESHOLD) <= 0) {
            esi = totalEarnings.multiply(ESI_PERCENT).setScale(2, RoundingMode.HALF_UP);
        }

        BigDecimal incomeTax = calculateIncomeTax(baseSalary);
        BigDecimal monthlyIncomeTax = incomeTax.divide(BigDecimal.valueOf(12), 2, RoundingMode.HALF_UP);

        BigDecimal professionalTax = PROFESSIONAL_TAX;
        if (totalEarnings.compareTo(new BigDecimal("15000")) < 0) {
            professionalTax = BigDecimal.ZERO;
        }

        BigDecimal totalDeductions = pf.add(esi).add(monthlyIncomeTax).add(professionalTax);
        BigDecimal netSalary = totalEarnings.subtract(totalDeductions).setScale(2, RoundingMode.HALF_UP);

        if (netSalary.compareTo(BigDecimal.ZERO) < 0) {
            netSalary = BigDecimal.ZERO;
        }

        salary.setProvidentFund(pf);
        salary.setEmployeeStateInsurance(esi);
        salary.setIncomeTax(monthlyIncomeTax);
        salary.setProfessionalTax(professionalTax);
        salary.setOtherDeductions(BigDecimal.ZERO);
        salary.setTotalDeductions(totalDeductions);
        salary.setNetSalary(netSalary);
        salary.setStatus("CALCULATED");

        return salary;
    }

    public BigDecimal calculateIncomeTax(BigDecimal annualSalary) {
        BigDecimal tax = BigDecimal.ZERO;
        double salary = annualSalary.doubleValue();

        if (salary <= 250000) {
            tax = BigDecimal.ZERO;
        } else if (salary <= 500000) {
            tax = BigDecimal.valueOf((salary - 250000) * 0.05);
        } else if (salary <= 1000000) {
            tax = BigDecimal.valueOf(12500 + (salary - 500000) * 0.20);
        } else {
            tax = BigDecimal.valueOf(112500 + (salary - 1000000) * 0.30);
        }

        return tax.setScale(2, RoundingMode.HALF_UP);
    }

    public boolean validateAttendance(List<Attendance> records) {
        if (records == null || records.isEmpty()) return false;
        for (Attendance a : records) {
            if (a.getEmployeeId() == null || a.getDate() == null || a.getStatus() == null) {
                return false;
            }
        }
        return true;
    }
}
