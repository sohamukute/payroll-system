package com.payroll.repository;

import com.payroll.model.Employee;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

public class EmployeeRepository {

    private Map<String, Employee> employees = new HashMap<>();
    private AtomicInteger idCounter = new AtomicInteger(1000);

    public Employee addEmployee(Employee employee) {
        if (employee.getEmployeeId() == null || employee.getEmployeeId().isEmpty()) {
            employee.setEmployeeId("EMP" + idCounter.incrementAndGet());
        }
        employees.put(employee.getEmployeeId(), employee);
        return employee;
    }

    public Employee getEmployee(String employeeId) {
        return employees.get(employeeId);
    }

    public List<Employee> getAllEmployees() {
        return new ArrayList<>(employees.values());
    }

    public List<Employee> getActiveEmployees() {
        List<Employee> active = new ArrayList<>();
        for (Employee e : employees.values()) {
            if ("ACTIVE".equals(e.getStatus())) {
                active.add(e);
            }
        }
        return active;
    }

    public Employee updateEmployee(Employee employee) {
        if (!employees.containsKey(employee.getEmployeeId())) {
            throw new RuntimeException("Employee not found: " + employee.getEmployeeId());
        }
        employees.put(employee.getEmployeeId(), employee);
        return employee;
    }

    public boolean deleteEmployee(String employeeId) {
        Employee emp = employees.get(employeeId);
        if (emp == null) return false;
        emp.setStatus("INACTIVE");
        return true;
    }

    public Employee findByEmail(String email) {
        for (Employee e : employees.values()) {
            if (email.equalsIgnoreCase(e.getEmail())) {
                return e;
            }
        }
        return null;
    }

    public List<Employee> findByDepartment(String department) {
        List<Employee> result = new ArrayList<>();
        for (Employee e : employees.values()) {
            if (department.equalsIgnoreCase(e.getDepartment())) {
                result.add(e);
            }
        }
        return result;
    }

    public List<Employee> searchByName(String query) {
        List<Employee> result = new ArrayList<>();
        String lowerQuery = query.toLowerCase();
        for (Employee e : employees.values()) {
            if (e.getFullName().toLowerCase().contains(lowerQuery)
                    || e.getFirstName().toLowerCase().contains(lowerQuery)
                    || e.getLastName().toLowerCase().contains(lowerQuery)) {
                result.add(e);
            }
        }
        return result;
    }

    public boolean exists(String employeeId) {
        return employees.containsKey(employeeId);
    }

    public int count() {
        return employees.size();
    }
}
