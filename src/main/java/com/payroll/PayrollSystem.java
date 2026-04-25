package com.payroll;

import com.payroll.model.Attendance;
import com.payroll.model.Employee;
import com.payroll.model.Salary;
import com.payroll.repository.EmployeeRepository;
import com.payroll.repository.SalaryRepository;
import com.payroll.service.PayrollCalculationService;
import com.payroll.service.PayslipGenerator;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Scanner;
public class PayrollSystem {

    private EmployeeRepository employeeRepository = new EmployeeRepository();
    private SalaryRepository salaryRepository = new SalaryRepository();
    private PayrollCalculationService calculationService = new PayrollCalculationService();
    private PayslipGenerator payslipGenerator = new PayslipGenerator();
    private Map<String, List<Attendance>> attendanceStore = new HashMap<>();
    private int attendanceIdCounter = 1;
    private Scanner scanner = new Scanner(System.in);

    private static final String PAYSLIP_DIR = "payslips";

    private static String repeat(String s, int n) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < n; i++) sb.append(s);
        return sb.toString();
    }

    public static void main(String[] args) {
        PayrollSystem system = new PayrollSystem();
        createPayslipsDir();

        if (args.length > 0 && args[0].equals("--demo")) {
            system.loadDemoData();
            system.runDemo();
        } else {
            system.run();
        }
    }

    private static void createPayslipsDir() {
        java.io.File dir = new java.io.File("payslips");
        if (!dir.exists()) dir.mkdirs();
    }

    public void run() {
        System.out.println(repeat("=", 50));
        System.out.println("    PAYROLL MANAGEMENT SYSTEM v1.0");
        System.out.println(repeat("=", 50));

        boolean running = true;
        while (running) {
            printMenu();
            String choice = scanner.nextLine().trim();

            switch (choice) {
                case "1": addEmployee(); break;
                case "2": viewEmployee(); break;
                case "3": listEmployees(); break;
                case "4": markAttendance(); break;
                case "5": viewAttendance(); break;
                case "6": calculateSalary(); break;
                case "7": viewPayslip(); break;
                case "8": processMonthlyPayroll(); break;
                case "9": viewPayrollReport(); break;
                case "10": searchEmployees(); break;
                case "11": loadDemoData(); System.out.println("Demo data loaded."); break;
                case "0":
                    System.out.println("Exiting. Goodbye!");
                    scanner.close();
                    running = false;
                    break;
                default:
                    System.out.println("Invalid option. Try again.");
            }
        }
    }

    private void printMenu() {
        System.out.println("\n" + repeat("-", 40));
        System.out.println(" MAIN MENU");
        System.out.println(repeat("-", 40));
        System.out.println(" 1. Add Employee");
        System.out.println(" 2. View Employee");
        System.out.println(" 3. List All Employees");
        System.out.println(" 4. Mark Attendance");
        System.out.println(" 5. View Attendance");
        System.out.println(" 6. Calculate Monthly Salary");
        System.out.println(" 7. View/Generate Payslip");
        System.out.println(" 8. Process Monthly Payroll");
        System.out.println(" 9. View Payroll Report");
        System.out.println("10. Search Employees");
        System.out.println("11. Load Demo Data");
        System.out.println(" 0. Exit");
        System.out.println(repeat("-", 40));
        System.out.print("Enter choice: ");
    }

    private void addEmployee() {
        System.out.println("\n--- Add Employee ---");
        System.out.print("First Name: ");
        String firstName = scanner.nextLine().trim();
        System.out.print("Last Name: ");
        String lastName = scanner.nextLine().trim();
        System.out.print("Email: ");
        String email = scanner.nextLine().trim();
        System.out.print("Phone: ");
        String phone = scanner.nextLine().trim();
        System.out.print("Department: ");
        String department = scanner.nextLine().trim();
        System.out.print("Position: ");
        String position = scanner.nextLine().trim();
        System.out.print("Base Salary (Rs.): ");
        BigDecimal salary;
        try {
            salary = new BigDecimal(scanner.nextLine().trim());
        } catch (NumberFormatException e) {
            System.out.println("Invalid salary. Employee not added.");
            return;
        }
        System.out.print("Bank Account Number: ");
        String bankAccount = scanner.nextLine().trim();

        Employee emp = new Employee();
        emp.setFirstName(firstName);
        emp.setLastName(lastName);
        emp.setEmail(email);
        emp.setPhone(phone);
        emp.setDepartment(department);
        emp.setPosition(position);
        emp.setBaseSalary(salary);
        emp.setBankAccountNumber(bankAccount);
        emp.setDateOfJoining(LocalDate.now());

        Employee saved = employeeRepository.addEmployee(emp);
        System.out.println("Employee added successfully! ID: " + saved.getEmployeeId());
    }

    private void viewEmployee() {
        System.out.print("\nEnter Employee ID: ");
        String id = scanner.nextLine().trim();
        Employee emp = employeeRepository.getEmployee(id);
        if (emp == null) {
            System.out.println("Employee not found: " + id);
            return;
        }
        System.out.println("\n" + emp);
        System.out.println("Date of Joining: " + emp.getDateOfJoining());
        if (emp.getPhone() != null) System.out.println("Phone: " + emp.getPhone());
        if (emp.getEmail() != null) System.out.println("Email: " + emp.getEmail());
    }

    private void listEmployees() {
        List<Employee> employees = employeeRepository.getAllEmployees();
        if (employees.isEmpty()) {
            System.out.println("\nNo employees found.");
            return;
        }
        System.out.println("\n" + repeat("-", 90));
        System.out.printf("%-10s %-20s %-15s %-20s %15s %10s%n",
                "ID", "Name", "Department", "Position", "Salary", "Status");
        System.out.println(repeat("-", 90));
        for (Employee emp : employees) {
            System.out.printf("%-10s %-20s %-15s %-20s %15s %10s%n",
                    emp.getEmployeeId(),
                    emp.getFullName(),
                    emp.getDepartment(),
                    emp.getPosition() != null ? emp.getPosition() : "N/A",
                    String.format("Rs.%,.2f", emp.getBaseSalary()),
                    emp.getStatus());
        }
        System.out.println(repeat("-", 90));
        System.out.println("Total: " + employees.size() + " employees");
    }

    private void markAttendance() {
        System.out.print("\nEmployee ID: ");
        String empId = scanner.nextLine().trim();
        Employee emp = employeeRepository.getEmployee(empId);
        if (emp == null) {
            System.out.println("Employee not found.");
            return;
        }
        System.out.print("Date (yyyy-MM-dd): ");
        LocalDate date;
        try {
            date = LocalDate.parse(scanner.nextLine().trim());
        } catch (DateTimeParseException e) {
            System.out.println("Invalid date format.");
            return;
        }
        System.out.print("Status (PRESENT/ABSENT/PAID_LEAVE/HALF_DAY): ");
        String status = scanner.nextLine().trim().toUpperCase();
        if (!isValidAttendanceStatus(status)) {
            System.out.println("Invalid status.");
            return;
        }

        List<Attendance> existing = getAttendanceForMonth(empId, YearMonth.from(date));
        for (Attendance a : existing) {
            if (a.getDate().equals(date)) {
                System.out.println("Attendance already marked for " + date);
                return;
            }
        }

        Attendance attendance = new Attendance(
                "ATT" + attendanceIdCounter++, empId, date, status);
        String key = empId + "_" + YearMonth.from(date);
        attendanceStore.computeIfAbsent(key, k -> new ArrayList<>()).add(attendance);
        System.out.println("Attendance marked for " + emp.getFullName() + " on " + date + " as " + status);
    }

    private void viewAttendance() {
        System.out.print("\nEmployee ID: ");
        String empId = scanner.nextLine().trim();
        System.out.print("Month (yyyy-MM): ");
        YearMonth month;
        try {
            month = YearMonth.parse(scanner.nextLine().trim());
        } catch (DateTimeParseException e) {
            System.out.println("Invalid month format.");
            return;
        }
        List<Attendance> records = getAttendanceForMonth(empId, month);
        if (records.isEmpty()) {
            System.out.println("No attendance records found.");
            return;
        }
        System.out.println("\nAttendance for " + empId + " - " + month);
        System.out.println(repeat("-", 35));
        int present = 0, absent = 0, leave = 0, half = 0;
        for (Attendance a : records) {
            System.out.printf("%s : %s%n", a.getDate(), a.getStatus());
            if (a.getStatus().equals("PRESENT")) present++;
            else if (a.getStatus().equals("ABSENT")) absent++;
            else if (a.getStatus().equals("PAID_LEAVE")) leave++;
            else if (a.getStatus().equals("HALF_DAY")) half++;
        }
        System.out.println(repeat("-", 35));
        System.out.printf("Present: %d | Absent: %d | Leave: %d | Half: %d%n",
                present, absent, leave, half);
    }

    private void calculateSalary() {
        System.out.print("\nEmployee ID: ");
        String empId = scanner.nextLine().trim();
        Employee emp = employeeRepository.getEmployee(empId);
        if (emp == null) {
            System.out.println("Employee not found.");
            return;
        }
        System.out.print("Month (yyyy-MM): ");
        YearMonth month;
        try {
            month = YearMonth.parse(scanner.nextLine().trim());
        } catch (DateTimeParseException e) {
            System.out.println("Invalid month format.");
            return;
        }
        List<Attendance> records = getAttendanceForMonth(empId, month);
        if (records.isEmpty()) {
            System.out.println("No attendance records for this month. Please mark attendance first.");
            return;
        }
        Salary alreadyDone = salaryRepository.findByEmployeeAndMonth(empId, month);
        if (alreadyDone != null) {
            System.out.println("Salary already calculated. Net: Rs." + String.format("%,.2f", alreadyDone.getNetSalary()));
            return;
        }
        try {
            Salary salary = calculationService.calculateSalary(emp, month, records);
            salaryRepository.addSalary(salary);
            System.out.println("\nSalary calculated successfully!");
            System.out.printf("Gross: Rs.%,.2f | Deductions: Rs.%,.2f | Net: Rs.%,.2f%n",
                    salary.getTotalEarnings(), salary.getTotalDeductions(), salary.getNetSalary());
        } catch (Exception e) {
            System.out.println("Error: " + e.getMessage());
        }
    }

    private void viewPayslip() {
        System.out.print("\nEmployee ID: ");
        String empId = scanner.nextLine().trim();
        Employee emp = employeeRepository.getEmployee(empId);
        if (emp == null) {
            System.out.println("Employee not found.");
            return;
        }
        System.out.print("Month (yyyy-MM): ");
        YearMonth month;
        try {
            month = YearMonth.parse(scanner.nextLine().trim());
        } catch (DateTimeParseException e) {
            System.out.println("Invalid month format.");
            return;
        }
        Salary salary = salaryRepository.findByEmployeeAndMonth(empId, month);
        if (salary == null) {
            System.out.println("No salary record found. Calculate salary first.");
            return;
        }
        payslipGenerator.displayPayslip(emp, salary);
        System.out.print("Save payslip to file? (y/n): ");
        if (scanner.nextLine().trim().equalsIgnoreCase("y")) {
            payslipGenerator.savePayslipToFile(emp, salary, PAYSLIP_DIR);
        }
    }

    private void processMonthlyPayroll() {
        System.out.print("\nMonth to process (yyyy-MM): ");
        YearMonth month;
        try {
            month = YearMonth.parse(scanner.nextLine().trim());
        } catch (DateTimeParseException e) {
            System.out.println("Invalid month format.");
            return;
        }
        List<Employee> employees = employeeRepository.getActiveEmployees();
        if (employees.isEmpty()) {
            System.out.println("No active employees found.");
            return;
        }

        System.out.println("\nProcessing payroll for " + month + "...");
        int success = 0, skipped = 0, failed = 0;
        BigDecimal totalPayroll = BigDecimal.ZERO;

        for (Employee emp : employees) {
            List<Attendance> records = getAttendanceForMonth(emp.getEmployeeId(), month);
            if (records.isEmpty()) {
                System.out.println("  SKIP: " + emp.getFullName() + " - no attendance records");
                skipped++;
                continue;
            }
            try {
                Salary existing = salaryRepository.findByEmployeeAndMonth(emp.getEmployeeId(), month);
                Salary salary;
                if (existing != null) {
                    salary = existing;
                } else {
                    salary = calculationService.calculateSalary(emp, month, records);
                    salaryRepository.addSalary(salary);
                }
                payslipGenerator.savePayslipToFile(emp, salary, PAYSLIP_DIR);
                totalPayroll = totalPayroll.add(salary.getNetSalary());
                System.out.println("  OK: " + emp.getFullName() + " -> Rs." + String.format("%,.2f", salary.getNetSalary()));
                success++;
            } catch (Exception e) {
                System.out.println("  FAIL: " + emp.getFullName() + " - " + e.getMessage());
                failed++;
            }
        }

        System.out.println("\n" + repeat("=", 50));
        System.out.println("PAYROLL SUMMARY - " + month);
        System.out.println(repeat("=", 50));
        System.out.println("Processed: " + success);
        System.out.println("Skipped:   " + skipped);
        System.out.println("Failed:    " + failed);
        System.out.printf("Total Payroll: Rs.%,.2f%n", totalPayroll);
        System.out.println(repeat("=", 50));
    }

    private void viewPayrollReport() {
        System.out.print("\nMonth (yyyy-MM): ");
        YearMonth month;
        try {
            month = YearMonth.parse(scanner.nextLine().trim());
        } catch (DateTimeParseException e) {
            System.out.println("Invalid month format.");
            return;
        }
        List<Salary> salaries = salaryRepository.findByMonth(month);
        if (salaries.isEmpty()) {
            System.out.println("No salary records for " + month);
            return;
        }

        System.out.println("\n" + repeat("=", 80));
        System.out.println("PAYROLL REPORT - " + month);
        System.out.println(repeat("=", 80));
        System.out.printf("%-12s %-20s %15s %15s %15s%n",
                "Emp ID", "Name", "Gross", "Deductions", "Net Pay");
        System.out.println(repeat("-", 80));

        BigDecimal totalGross = BigDecimal.ZERO;
        BigDecimal totalDeductions = BigDecimal.ZERO;
        BigDecimal totalNet = BigDecimal.ZERO;

        for (Salary s : salaries) {
            Employee emp = employeeRepository.getEmployee(s.getEmployeeId());
            String name = emp != null ? emp.getFullName() : s.getEmployeeId();
            System.out.printf("%-12s %-20s %15s %15s %15s%n",
                    s.getEmployeeId(), name,
                    String.format("Rs.%,.2f", s.getTotalEarnings()),
                    String.format("Rs.%,.2f", s.getTotalDeductions()),
                    String.format("Rs.%,.2f", s.getNetSalary()));
            totalGross = totalGross.add(s.getTotalEarnings());
            totalDeductions = totalDeductions.add(s.getTotalDeductions());
            totalNet = totalNet.add(s.getNetSalary());
        }

        System.out.println(repeat("-", 80));
        System.out.printf("%-12s %-20s %15s %15s %15s%n",
                "", "TOTAL",
                String.format("Rs.%,.2f", totalGross),
                String.format("Rs.%,.2f", totalDeductions),
                String.format("Rs.%,.2f", totalNet));
        System.out.println(repeat("=", 80));
        System.out.println("Employees processed: " + salaries.size());
    }

    private void searchEmployees() {
        System.out.print("\nSearch by name: ");
        String query = scanner.nextLine().trim();
        List<Employee> results = employeeRepository.searchByName(query);
        if (results.isEmpty()) {
            System.out.println("No employees found matching: " + query);
            return;
        }
        System.out.println("\nFound " + results.size() + " result(s):");
        for (Employee emp : results) {
            System.out.println("  " + emp);
        }
    }

    public void loadDemoData() {
        System.out.println("\nLoading demo data...");

        Employee[] employees = {
            createEmp("Raj", "Kumar", "raj.kumar@company.com", "9876543210",
                    "50000", "Engineering", "Software Engineer", "ACC001234567890"),
            createEmp("Priya", "Singh", "priya.singh@company.com", "9876543211",
                    "45000", "HR", "HR Manager", "ACC001234567891"),
            createEmp("Amit", "Patel", "amit.patel@company.com", "9876543212",
                    "55000", "Finance", "Finance Analyst", "ACC001234567892"),
            createEmp("Neha", "Sharma", "neha.sharma@company.com", "9876543213",
                    "40000", "Operations", "Operations Lead", "ACC001234567893"),
            createEmp("Vikram", "Gupta", "vikram.gupta@company.com", "9876543214",
                    "60000", "Engineering", "Senior Engineer", "ACC001234567894")
        };

        for (Employee emp : employees) {
            employeeRepository.addEmployee(emp);
            System.out.println("  Added: " + emp.getFullName() + " [" + emp.getEmployeeId() + "]");
        }

        YearMonth month = YearMonth.now();
        int totalDays = month.lengthOfMonth();

        for (Employee emp : employees) {
            for (int day = 1; day <= totalDays; day++) {
                LocalDate date = month.atDay(day);
                DayOfWeek dow = date.getDayOfWeek();
                if (dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY) continue;

                String status;
                if (day % 15 == 0) {
                    status = "PAID_LEAVE";
                } else if (day % 20 == 0) {
                    status = "ABSENT";
                } else {
                    status = "PRESENT";
                }

                Attendance att = new Attendance(
                        "ATT" + attendanceIdCounter++,
                        emp.getEmployeeId(), date, status);
                String key = emp.getEmployeeId() + "_" + month;
                attendanceStore.computeIfAbsent(key, k -> new ArrayList<>()).add(att);
            }
        }

        System.out.println("  Attendance marked for " + month);
        System.out.println("Demo data loaded! Use option 8 to process payroll for " + month);
    }

    private void runDemo() {
        System.out.println("\n" + repeat("=", 50));
        System.out.println("  DEMO MODE - Payroll Management System");
        System.out.println(repeat("=", 50));

        YearMonth month = YearMonth.now();
        List<Employee> employees = employeeRepository.getActiveEmployees();

        System.out.println("\nProcessing payroll for " + month + "...");
        BigDecimal totalPayroll = BigDecimal.ZERO;

        for (Employee emp : employees) {
            List<Attendance> records = getAttendanceForMonth(emp.getEmployeeId(), month);
            if (records.isEmpty()) continue;
            Salary salary = calculationService.calculateSalary(emp, month, records);
            salaryRepository.addSalary(salary);
            payslipGenerator.savePayslipToFile(emp, salary, PAYSLIP_DIR);
            totalPayroll = totalPayroll.add(salary.getNetSalary());
            System.out.printf("  %s -> Net: Rs.%,.2f%n", emp.getFullName(), salary.getNetSalary());
        }

        System.out.println("\n" + repeat("=", 50));
        System.out.printf("  Total Payroll (April 2026): Rs.%,.2f%n", totalPayroll);    // runDemo always uses 2026
        System.out.println("  Payslips saved to ./payslips/");
        System.out.println(repeat("=", 50));
    }

    private Employee createEmp(String first, String last, String email, String phone,
                               String salary, String dept, String position, String bank) {
        Employee emp = new Employee();
        emp.setFirstName(first);
        emp.setLastName(last);
        emp.setEmail(email);
        emp.setPhone(phone);
        emp.setBaseSalary(new BigDecimal(salary));
        emp.setDepartment(dept);
        emp.setPosition(position);
        emp.setBankAccountNumber(bank);
        emp.setDateOfJoining(LocalDate.of(2024, 1, 15));
        return emp;
    }

    private List<Attendance> getAttendanceForMonth(String employeeId, YearMonth month) {
        String key = employeeId + "_" + month;
        return attendanceStore.getOrDefault(key, new ArrayList<>());
    }

    private boolean isValidAttendanceStatus(String status) {
        return status.equals("PRESENT") || status.equals("ABSENT")
                || status.equals("PAID_LEAVE") || status.equals("HALF_DAY")
                || status.equals("HOLIDAY");
    }
}
