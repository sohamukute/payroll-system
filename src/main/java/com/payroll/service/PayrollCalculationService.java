package com.payroll.service;

import com.payroll.model.Attendance;
import com.payroll.model.Employee;
import com.payroll.model.Salary;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;

public class PayrollCalculationService {

    private static final BigDecimal HRA_PERCENT          = new BigDecimal("0.40");
    private static final BigDecimal DA_PERCENT           = new BigDecimal("0.50");
    private static final BigDecimal SPECIAL_PERCENT      = new BigDecimal("0.10");
    private static final BigDecimal PF_PERCENT           = new BigDecimal("0.12");
    private static final BigDecimal ESI_PERCENT          = new BigDecimal("0.0075");
    private static final BigDecimal ESI_THRESHOLD        = new BigDecimal("21000");
    private static final BigDecimal PF_WAGE_CEILING      = new BigDecimal("15000");
    private static final BigDecimal PROFESSIONAL_TAX_HI  = new BigDecimal("200");
    private static final BigDecimal PROFESSIONAL_TAX_MID = new BigDecimal("150");
    private static final BigDecimal STANDARD_DEDUCTION   = new BigDecimal("75000");

    public Salary calculateSalary(Employee employee, YearMonth month, List<Attendance> attendanceRecords) {
        if (employee == null) throw new IllegalArgumentException("Employee cannot be null");
        if (month == null)    throw new IllegalArgumentException("Month cannot be null");
        if (attendanceRecords == null || attendanceRecords.isEmpty()) {
            throw new IllegalArgumentException(
                "No attendance records for " + employee.getEmployeeId() + " in " + month);
        }

        Salary salary = new Salary();
        salary.setEmployeeId(employee.getEmployeeId());
        salary.setMonth(month);
        salary.setCalculatedAt(LocalDateTime.now());

        int totalDaysInMonth = month.lengthOfMonth();
        int presentDays = 0, paidLeaveDays = 0, absentDays = 0, halfDays = 0;
        double effectiveDays = 0.0;

        for (Attendance a : attendanceRecords) {
            switch (a.getStatus()) {
                case "PRESENT":    presentDays++;   effectiveDays += 1.0; break;
                case "PAID_LEAVE": paidLeaveDays++; effectiveDays += 1.0; break;
                case "HALF_DAY":   halfDays++;      effectiveDays += 0.5; break;
                case "ABSENT":     absentDays++;                          break;
                default: break;
            }
        }

        salary.setPresentDays(presentDays);
        salary.setPaidLeaveDays(paidLeaveDays);
        salary.setAbsentDays(absentDays);
        salary.setHalfDays(halfDays);
        salary.setWorkingDays((int) Math.round(effectiveDays));

        BigDecimal baseSalary   = employee.getBaseSalary();
        BigDecimal perDay       = baseSalary.divide(BigDecimal.valueOf(totalDaysInMonth), 10, RoundingMode.HALF_UP);
        BigDecimal basicSalary  = perDay.multiply(BigDecimal.valueOf(effectiveDays)).setScale(2, RoundingMode.HALF_UP);

        BigDecimal hra              = basicSalary.multiply(HRA_PERCENT).setScale(2, RoundingMode.HALF_UP);
        BigDecimal da               = basicSalary.multiply(DA_PERCENT).setScale(2, RoundingMode.HALF_UP);
        BigDecimal specialAllowance = basicSalary.multiply(SPECIAL_PERCENT).setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalEarnings    = basicSalary.add(hra).add(da).add(specialAllowance);

        salary.setBasicSalary(basicSalary);
        salary.setHouseRentAllowance(hra);
        salary.setDearnessAllowance(da);
        salary.setSpecialAllowance(specialAllowance);
        salary.setTotalEarnings(totalEarnings);

        // PF: 12% of (basic+DA), capped at wage ceiling of Rs.15,000
        BigDecimal pfBase = basicSalary.add(da).min(PF_WAGE_CEILING);
        BigDecimal pf     = pfBase.multiply(PF_PERCENT).setScale(2, RoundingMode.HALF_UP);

        // ESI: 0.75% if gross <= Rs.21,000
        BigDecimal esi = BigDecimal.ZERO;
        if (totalEarnings.compareTo(ESI_THRESHOLD) <= 0) {
            esi = totalEarnings.multiply(ESI_PERCENT).setScale(2, RoundingMode.HALF_UP);
        }

        // Income Tax: 2025-26 new regime, annual salary * 12
        BigDecimal annualSalary      = baseSalary.multiply(BigDecimal.valueOf(12));
        BigDecimal annualTax         = calculateIncomeTax(annualSalary);
        BigDecimal monthlyIncomeTax  = annualTax.divide(BigDecimal.valueOf(12), 2, RoundingMode.HALF_UP);

        // Professional Tax (Maharashtra slabs)
        BigDecimal professionalTax = BigDecimal.ZERO;
        if (totalEarnings.compareTo(new BigDecimal("20000")) >= 0) {
            professionalTax = PROFESSIONAL_TAX_HI;
        } else if (totalEarnings.compareTo(new BigDecimal("10000")) >= 0) {
            professionalTax = PROFESSIONAL_TAX_MID;
        }

        BigDecimal totalDeductions = pf.add(esi).add(monthlyIncomeTax).add(professionalTax);
        BigDecimal netSalary       = totalEarnings.subtract(totalDeductions).setScale(2, RoundingMode.HALF_UP);
        if (netSalary.compareTo(BigDecimal.ZERO) < 0) netSalary = BigDecimal.ZERO;

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

    /**
     * FY 2025-26 New Tax Regime (Budget 2025).
     * Standard deduction Rs.75,000 for salaried.
     * Section 87A rebate: if taxable income <= Rs.12,00,000 -> zero tax.
     * Health and Education cess: 4% on computed tax.
     *
     * Slabs on taxable income:
     *   0          - 4,00,000  : 0%
     *   4,00,001   - 8,00,000  : 5%
     *   8,00,001   - 12,00,000 : 10%
     *   12,00,001  - 16,00,000 : 15%
     *   16,00,001  - 20,00,000 : 20%
     *   20,00,001  - 24,00,000 : 25%
     *   above 24,00,000        : 30%
     */
    public BigDecimal calculateIncomeTax(BigDecimal annualGrossSalary) {
        BigDecimal taxableIncome = annualGrossSalary.subtract(STANDARD_DEDUCTION);
        if (taxableIncome.compareTo(BigDecimal.ZERO) < 0) taxableIncome = BigDecimal.ZERO;

        // Section 87A: full rebate if taxable income <= 12,00,000
        if (taxableIncome.compareTo(new BigDecimal("1200000")) <= 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal[] slabLimits = {
            new BigDecimal("400000"),
            new BigDecimal("800000"),
            new BigDecimal("1200000"),
            new BigDecimal("1600000"),
            new BigDecimal("2000000"),
            new BigDecimal("2400000")
        };
        BigDecimal[] slabRates = {
            new BigDecimal("0.00"),
            new BigDecimal("0.05"),
            new BigDecimal("0.10"),
            new BigDecimal("0.15"),
            new BigDecimal("0.20"),
            new BigDecimal("0.25"),
            new BigDecimal("0.30")
        };

        BigDecimal tax = BigDecimal.ZERO;
        BigDecimal prev = BigDecimal.ZERO;

        for (int i = 0; i < slabLimits.length; i++) {
            if (taxableIncome.compareTo(prev) <= 0) break;
            BigDecimal slab = taxableIncome.min(slabLimits[i]).subtract(prev);
            tax = tax.add(slab.multiply(slabRates[i]));
            prev = slabLimits[i];
        }
        if (taxableIncome.compareTo(slabLimits[slabLimits.length - 1]) > 0) {
            tax = tax.add(
                taxableIncome.subtract(slabLimits[slabLimits.length - 1])
                             .multiply(slabRates[slabRates.length - 1]));
        }

        // 4% Health and Education cess
        tax = tax.multiply(new BigDecimal("1.04"));

        return tax.setScale(2, RoundingMode.HALF_UP);
    }

    public boolean validateAttendance(List<Attendance> records) {
        if (records == null || records.isEmpty()) return false;
        for (Attendance a : records) {
            if (a.getEmployeeId() == null || a.getDate() == null || a.getStatus() == null) return false;
        }
        return true;
    }
}
