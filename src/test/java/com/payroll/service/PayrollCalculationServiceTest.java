package com.payroll.service;

import com.payroll.model.Attendance;
import com.payroll.model.Employee;
import com.payroll.model.Salary;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class PayrollCalculationServiceTest {

    private PayrollCalculationService service;
    private Employee testEmployee;

    @BeforeEach
    void setUp() {
        service = new PayrollCalculationService();
        testEmployee = new Employee("EMP001", "John", "Doe", "john@company.com",
                new BigDecimal("50000"), "Engineering");
        testEmployee.setPosition("Software Engineer");
        testEmployee.setBankAccountNumber("ACC1234567890");
    }

    private List<Attendance> createAttendance(String employeeId, YearMonth month, int presentDays) {
        List<Attendance> records = new ArrayList<>();
        int count = 0;
        for (int day = 1; day <= month.lengthOfMonth() && count < presentDays; day++) {
            LocalDate date = month.atDay(day);
            if (date.getDayOfWeek().getValue() < 6) {
                records.add(new Attendance("ATT" + day, employeeId, date, "PRESENT"));
                count++;
            }
        }
        return records;
    }

    private List<Attendance> createFullMonthAttendance(String employeeId, YearMonth month) {
        List<Attendance> records = new ArrayList<>();
        for (int day = 1; day <= month.lengthOfMonth(); day++) {
            LocalDate date = month.atDay(day);
            if (date.getDayOfWeek().getValue() < 6) {
                records.add(new Attendance("ATT" + day, employeeId, date, "PRESENT"));
            }
        }
        return records;
    }

    @Test
    void testSalaryCalculationWithFullAttendance() {
        YearMonth month = YearMonth.of(2025, 4);
        List<Attendance> records = createFullMonthAttendance(testEmployee.getEmployeeId(), month);
        Salary salary = service.calculateSalary(testEmployee, month, records);

        assertNotNull(salary);
        assertNotNull(salary.getNetSalary());
        assertTrue(salary.getNetSalary().compareTo(BigDecimal.ZERO) > 0);
        assertEquals("CALCULATED", salary.getStatus());
    }

    @Test
    void testNetSalaryIsLessThanGross() {
        YearMonth month = YearMonth.of(2025, 4);
        List<Attendance> records = createFullMonthAttendance(testEmployee.getEmployeeId(), month);
        Salary salary = service.calculateSalary(testEmployee, month, records);

        assertTrue(salary.getNetSalary().compareTo(salary.getTotalEarnings()) < 0);
    }

    @Test
    void testPartialMonthAttendance() {
        YearMonth month = YearMonth.of(2025, 4);
        List<Attendance> records = createAttendance(testEmployee.getEmployeeId(), month, 10);
        List<Attendance> full = createFullMonthAttendance(testEmployee.getEmployeeId(), month);

        Salary partial = service.calculateSalary(testEmployee, month, records);
        Salary fullSalary = service.calculateSalary(testEmployee, month, full);

        assertTrue(partial.getNetSalary().compareTo(fullSalary.getNetSalary()) < 0);
    }

    @Test
    void testProvidentFundCalculation() {
        YearMonth month = YearMonth.of(2025, 4);
        List<Attendance> records = createFullMonthAttendance(testEmployee.getEmployeeId(), month);
        Salary salary = service.calculateSalary(testEmployee, month, records);

        assertNotNull(salary.getProvidentFund());
        assertTrue(salary.getProvidentFund().compareTo(BigDecimal.ZERO) > 0);
    }

    @Test
    void testHRAIsFortyPercentOfBasic() {
        YearMonth month = YearMonth.of(2025, 4);
        List<Attendance> records = createFullMonthAttendance(testEmployee.getEmployeeId(), month);
        Salary salary = service.calculateSalary(testEmployee, month, records);

        BigDecimal expectedHRA = salary.getBasicSalary().multiply(new BigDecimal("0.40"))
                .setScale(2, java.math.RoundingMode.HALF_UP);
        assertEquals(0, expectedHRA.compareTo(salary.getHouseRentAllowance()));
    }

    @Test
    void testDAIsFiftyPercentOfBasic() {
        YearMonth month = YearMonth.of(2025, 4);
        List<Attendance> records = createFullMonthAttendance(testEmployee.getEmployeeId(), month);
        Salary salary = service.calculateSalary(testEmployee, month, records);

        BigDecimal expectedDA = salary.getBasicSalary().multiply(new BigDecimal("0.50"))
                .setScale(2, java.math.RoundingMode.HALF_UP);
        assertEquals(0, expectedDA.compareTo(salary.getDearnessAllowance()));
    }

    @Test
    void testESIAppliedWhenSalaryBelow21000() {
        Employee lowSalaryEmp = new Employee("EMP002", "Jane", "Smith", "jane@co.com",
                new BigDecimal("12000"), "Support");
        YearMonth month = YearMonth.of(2025, 4);
        List<Attendance> records = createFullMonthAttendance(lowSalaryEmp.getEmployeeId(), month);
        Salary salary = service.calculateSalary(lowSalaryEmp, month, records);

        assertTrue(salary.getEmployeeStateInsurance().compareTo(BigDecimal.ZERO) > 0);
    }

    @Test
    void testESINotAppliedWhenSalaryAbove21000() {
        YearMonth month = YearMonth.of(2025, 4);
        List<Attendance> records = createFullMonthAttendance(testEmployee.getEmployeeId(), month);
        Salary salary = service.calculateSalary(testEmployee, month, records);

        assertEquals(0, BigDecimal.ZERO.compareTo(salary.getEmployeeStateInsurance()));
    }

    @Test
    void testIncomeTaxForHighSalary() {
        Employee highSalaryEmp = new Employee("EMP003", "Alex", "Kumar", "alex@co.com",
                new BigDecimal("150000"), "Executive");
        BigDecimal tax = service.calculateIncomeTax(new BigDecimal("150000"));
        assertTrue(tax.compareTo(BigDecimal.ZERO) > 0);
    }

    @Test
    void testIncomeTaxZeroForLowSalary() {
        BigDecimal tax = service.calculateIncomeTax(new BigDecimal("200000"));
        assertEquals(0, BigDecimal.ZERO.compareTo(tax));
    }

    @Test
    void testPaidLeaveDaysCountedInSalary() {
        YearMonth month = YearMonth.of(2025, 4);
        List<Attendance> records = new ArrayList<>();
        records.add(new Attendance("ATT1", testEmployee.getEmployeeId(), month.atDay(1), "PRESENT"));
        records.add(new Attendance("ATT2", testEmployee.getEmployeeId(), month.atDay(2), "PAID_LEAVE"));
        records.add(new Attendance("ATT3", testEmployee.getEmployeeId(), month.atDay(3), "ABSENT"));

        Salary salary = service.calculateSalary(testEmployee, month, records);

        assertEquals(1, salary.getPresentDays());
        assertEquals(1, salary.getPaidLeaveDays());
        assertEquals(1, salary.getAbsentDays());
    }

    @Test
    void testHalfDayCountsAsHalfDay() {
        YearMonth month = YearMonth.of(2025, 4);
        List<Attendance> records = new ArrayList<>();
        records.add(new Attendance("ATT1", testEmployee.getEmployeeId(), month.atDay(1), "HALF_DAY"));
        records.add(new Attendance("ATT2", testEmployee.getEmployeeId(), month.atDay(2), "HALF_DAY"));

        Salary salary = service.calculateSalary(testEmployee, month, records);

        assertEquals(2, salary.getHalfDays());
        assertEquals(1, salary.getWorkingDays());
    }

    @Test
    void testNullEmployeeThrowsException() {
        YearMonth month = YearMonth.of(2025, 4);
        List<Attendance> records = new ArrayList<>();
        records.add(new Attendance("ATT1", "EMP001", month.atDay(1), "PRESENT"));

        assertThrows(IllegalArgumentException.class, () ->
                service.calculateSalary(null, month, records));
    }

    @Test
    void testEmptyAttendanceThrowsException() {
        YearMonth month = YearMonth.of(2025, 4);
        assertThrows(IllegalArgumentException.class, () ->
                service.calculateSalary(testEmployee, month, new ArrayList<>()));
    }

    @Test
    void testTotalEarningsEqualsBasicPlusAllowances() {
        YearMonth month = YearMonth.of(2025, 4);
        List<Attendance> records = createFullMonthAttendance(testEmployee.getEmployeeId(), month);
        Salary salary = service.calculateSalary(testEmployee, month, records);

        BigDecimal expected = salary.getBasicSalary()
                .add(salary.getHouseRentAllowance())
                .add(salary.getDearnessAllowance())
                .add(salary.getSpecialAllowance());
        assertEquals(0, expected.compareTo(salary.getTotalEarnings()));
    }
}
