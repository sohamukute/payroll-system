package com.payroll.repository;

import com.payroll.model.Salary;

import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

public class SalaryRepository {

    private List<Salary> salaries = new ArrayList<>();
    private AtomicInteger idCounter = new AtomicInteger(1);

    public Salary addSalary(Salary salary) {
        if (salary.getSalaryId() == null || salary.getSalaryId().isEmpty()) {
            salary.setSalaryId("SAL" + String.format("%04d", idCounter.getAndIncrement()));
        }
        salaries.add(salary);
        return salary;
    }

    public Salary findByEmployeeAndMonth(String employeeId, YearMonth month) {
        for (Salary s : salaries) {
            if (s.getEmployeeId().equals(employeeId) && s.getMonth().equals(month)) {
                return s;
            }
        }
        return null;
    }

    public List<Salary> findByEmployee(String employeeId) {
        List<Salary> result = new ArrayList<>();
        for (Salary s : salaries) {
            if (s.getEmployeeId().equals(employeeId)) {
                result.add(s);
            }
        }
        return result;
    }

    public List<Salary> findByMonth(YearMonth month) {
        List<Salary> result = new ArrayList<>();
        for (Salary s : salaries) {
            if (s.getMonth().equals(month)) {
                result.add(s);
            }
        }
        return result;
    }

    public List<Salary> findByStatus(String status) {
        List<Salary> result = new ArrayList<>();
        for (Salary s : salaries) {
            if (status.equals(s.getStatus())) {
                result.add(s);
            }
        }
        return result;
    }

    public boolean updateStatus(String employeeId, YearMonth month, String newStatus) {
        for (Salary s : salaries) {
            if (s.getEmployeeId().equals(employeeId) && s.getMonth().equals(month)) {
                s.setStatus(newStatus);
                return true;
            }
        }
        return false;
    }

    public Salary updateSalary(Salary updated) {
        for (int i = 0; i < salaries.size(); i++) {
            Salary s = salaries.get(i);
            if (s.getSalaryId().equals(updated.getSalaryId())) {
                salaries.set(i, updated);
                return updated;
            }
        }
        throw new RuntimeException("Salary record not found: " + updated.getSalaryId());
    }

    public List<Salary> getAllSalaries() {
        return new ArrayList<>(salaries);
    }

    public int countByMonth(YearMonth month) {
        int count = 0;
        for (Salary s : salaries) {
            if (s.getMonth().equals(month)) count++;
        }
        return count;
    }
}
