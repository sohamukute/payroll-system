package com.payroll.service;

import com.payroll.model.Employee;
import com.payroll.model.Salary;

import java.io.FileWriter;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;

public class PayslipGenerator {

    private static final String SEPARATOR = "=" .repeat(60);
    private static final String THIN_LINE = "-" .repeat(60);

    public String generatePayslip(Employee employee, Salary salary) {
        StringBuilder sb = new StringBuilder();

        sb.append(SEPARATOR).append("\n");
        sb.append(centerText("PAYSLIP", 60)).append("\n");
        sb.append(centerText("For the month of " + salary.getMonth(), 60)).append("\n");
        sb.append(SEPARATOR).append("\n");

        sb.append("\n");
        sb.append(String.format("Employee ID   : %s%n", employee.getEmployeeId()));
        sb.append(String.format("Name          : %s%n", employee.getFullName()));
        sb.append(String.format("Department    : %s%n", employee.getDepartment()));
        sb.append(String.format("Position      : %s%n", employee.getPosition() != null ? employee.getPosition() : "N/A"));
        if (employee.getBankAccountNumber() != null) {
            sb.append(String.format("Bank Account  : %s%n", maskBankAccount(employee.getBankAccountNumber())));
        }
        sb.append("\n");

        sb.append(THIN_LINE).append("\n");
        sb.append(String.format("Working Days  : %d | Present: %d | Leave: %d | Absent: %d%n",
                salary.getWorkingDays(), salary.getPresentDays(),
                salary.getPaidLeaveDays(), salary.getAbsentDays()));
        sb.append(THIN_LINE).append("\n");

        sb.append("\n");
        sb.append(String.format("%-35s %20s%n", "EARNINGS", "DEDUCTIONS"));
        sb.append(THIN_LINE).append("\n");

        sb.append(String.format("%-35s %20s%n",
                formatEntry("Basic Salary", salary.getBasicSalary()),
                formatEntry("Provident Fund", salary.getProvidentFund())));

        sb.append(String.format("%-35s %20s%n",
                formatEntry("House Rent Allowance", salary.getHouseRentAllowance()),
                formatEntry("ESI", salary.getEmployeeStateInsurance())));

        sb.append(String.format("%-35s %20s%n",
                formatEntry("Dearness Allowance", salary.getDearnessAllowance()),
                formatEntry("Income Tax", salary.getIncomeTax())));

        sb.append(String.format("%-35s %20s%n",
                formatEntry("Special Allowance", salary.getSpecialAllowance()),
                formatEntry("Professional Tax", salary.getProfessionalTax())));

        if (salary.getBonus().compareTo(BigDecimal.ZERO) > 0) {
            sb.append(String.format("%-35s%n", formatEntry("Bonus", salary.getBonus())));
        }
        if (salary.getOvertimePay().compareTo(BigDecimal.ZERO) > 0) {
            sb.append(String.format("%-35s%n", formatEntry("Overtime Pay", salary.getOvertimePay())));
        }

        sb.append(THIN_LINE).append("\n");
        sb.append(String.format("%-35s %20s%n",
                formatEntry("Total Earnings", salary.getTotalEarnings()),
                formatEntry("Total Deductions", salary.getTotalDeductions())));
        sb.append(THIN_LINE).append("\n");

        sb.append("\n");
        sb.append(SEPARATOR).append("\n");
        sb.append(String.format("NET SALARY PAYABLE: Rs. %,.2f%n", salary.getNetSalary()));
        sb.append(String.format("In Words: %s%n", convertToWords(salary.getNetSalary())));
        sb.append(SEPARATOR).append("\n");

        if (salary.getCalculatedAt() != null) {
            sb.append(String.format("%nGenerated on: %s%n",
                    salary.getCalculatedAt().format(DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm"))));
        }
        sb.append(String.format("Status: %s%n", salary.getStatus()));
        sb.append(SEPARATOR).append("\n");

        return sb.toString();
    }

    public void displayPayslip(Employee employee, Salary salary) {
        System.out.println(generatePayslip(employee, salary));
    }

    public void savePayslipToFile(Employee employee, Salary salary, String directory) {
        String filename = String.format("%s/%s_%s_payslip.txt",
                directory, employee.getEmployeeId(), salary.getMonth());
        try (FileWriter fw = new FileWriter(filename)) {
            fw.write(generatePayslip(employee, salary));
            System.out.println("Payslip saved to: " + filename);
        } catch (IOException e) {
            System.err.println("Error saving payslip: " + e.getMessage());
        }
    }

    private String formatEntry(String label, BigDecimal amount) {
        return String.format("%s: Rs.%,.2f", label, amount);
    }

    public String maskBankAccount(String accountNumber) {
        if (accountNumber == null || accountNumber.length() < 4) return "****";
        int len = accountNumber.length();
        return "*" .repeat(len - 4) + accountNumber.substring(len - 4);
    }

    private String centerText(String text, int width) {
        int padding = (width - text.length()) / 2;
        return " ".repeat(Math.max(0, padding)) + text;
    }

    public String convertToWords(BigDecimal amount) {
        long rupees = amount.longValue();
        if (rupees == 0) return "Zero Rupees Only";

        String[] ones = {"", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
                "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
                "Seventeen", "Eighteen", "Nineteen"};
        String[] tens = {"", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"};

        if (rupees < 0) return "Negative " + convertToWords(amount.negate());

        String result = "";
        if (rupees >= 10000000) {
            result += ones[(int) (rupees / 10000000)] + " Crore ";
            rupees %= 10000000;
        }
        if (rupees >= 100000) {
            result += convertChunk((int) (rupees / 100000)) + " Lakh ";
            rupees %= 100000;
        }
        if (rupees >= 1000) {
            result += convertChunk((int) (rupees / 1000)) + " Thousand ";
            rupees %= 1000;
        }
        result += convertChunk((int) rupees);

        return result.trim() + " Rupees Only";
    }

    private String convertChunk(int number) {
        String[] ones = {"", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
                "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
                "Seventeen", "Eighteen", "Nineteen"};
        String[] tens = {"", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"};

        if (number == 0) return "";
        if (number < 20) return ones[number] + " ";
        if (number < 100) return tens[number / 10] + " " + ones[number % 10] + " ";
        return ones[number / 100] + " Hundred " + convertChunk(number % 100);
    }
}
