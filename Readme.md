
# **Helios: A Thermo-Hydraulic Design & Simulation Platform**

![Python](https://img.shields.io/badge/python-3.10+-blue.svg)
![Flask](https://img.shields.io/badge/Flask-2.2.2-black.svg)
![Pandas](https://img.shields.io/badge/Pandas-1.5-blue)
![License](https://img.shields.io/badge/License-MIT-green.svg)

Helios is a full-stack web platform engineered to automate and optimize the complex process of designing and rating industrial shell-and-tube heat exchangers. It transforms a traditionally manual, error-prone workflow into a secure, data-driven, and collaborative digital experience.

The platform serves as a single source of truth for engineering teams, integrating complex thermo-fluid dynamics calculations with a modern, intuitive user interface to deliver rapid and reliable design validation.

---

### **1. The Problem: Bridging the Gap Between Engineering and Software**

The project was conceived to solve a dual-faceted problem that exists at the intersection of traditional process engineering and modern software development.

#### **The Engineering Challenge**

*   **High-Stakes Calculations:** Designing heat exchangers involves complex calculations based on industry standards (like TEMA). A minor error in a spreadsheet can lead to an under-performing or over-specified unit, resulting in significant financial loss or operational failure.
*   **Iterative & Repetitive Workflow:** The design process is highly iterative. Engineers must manually recalculate dozens of parameters to test different configurations, a time-consuming and inefficient process.
*   **Lack of Standardization:** Reliance on disparate, legacy spreadsheets across an organization leads to a lack of standardization, version control issues, and a high risk of using outdated or incorrect formulas.

#### **The Software Challenge**

*   **Data Silos:** Critical design data is often trapped in offline Excel files on individual computers. This creates data silos, preventing collaboration, trend analysis, and institutional knowledge sharing.
*   **No Centralized Access or Security:** There is no secure, role-based access to sensitive design data. Sharing files via email is insecure and inefficient.
*   **Scalability & Maintainability:** Spreadsheets with complex, interlinked formulas are notoriously difficult to maintain, debug, and scale. Adding new calculation methodologies or fluid properties is a high-risk endeavor.

**Helios was built to directly address these challenges by providing a robust, centralized, and intelligent software solution.**

---

### **2. Key Features**

Helios is more than a calculator; it is an end-to-end simulation platform with features designed for professional engineering workflows.

#### **Core Simulation Engine:**
*   **Intelligent Thermal Balance Solver:** The system can solve for any two unknown process variables (flow rates, outlet temperatures, or heat duty), providing flexibility for various design scenarios.
*   **Dual-Methodology Analysis:** Implements and compares two industry-standard shell-side calculation methods:
    1.  **Kern's Method:** For rapid, preliminary analysis.
    2.  **Bell-Delaware Method:** A rigorous, iterative method that accounts for bypass and leakage streams, providing highly accurate performance predictions.
*   **Comprehensive Pressure Drop Calculation:** Models pressure losses on both the shell and tube sides, including nozzle and return losses.
*   **Dynamic Fluid Property Database:** Fetches and interpolates fluid properties (density, viscosity, Cp, k) based on real-time temperature inputs from an internal data source.

#### **Platform & Workflow Features:**
*   **Secure User Authentication:** A complete login/registration system with password hashing (`Werkzeug`) and session management (`Flask-Login`).
*   **Role-Based Access Control (RBAC):** Features a two-tiered user system. **Admins** can manage the user base (create/delete users), while **Users** can perform calculations.
*   **Multi-Step Guided Workflow:** A "wizard-style" interface guides users logically through a sequence of data entry steps: Project Details -> Thermal -> Geometry -> Materials -> Nozzles.
*   **Client-Side State Management:** Utilizes browser `sessionStorage` to persist all user inputs across the multi-page workflow, ensuring a seamless experience without data loss.

#### **Reporting & User Experience:**
*   **Automated Performance Reporting:** Dynamically generates a detailed, multi-section web report summarizing all inputs and calculated results.
*   **TEMA Datasheet Generation:** Produces a professional, print-optimized TEMA-style datasheet, a standard deliverable in the process industry.
*   **At-a-Glance Design Validation:** The report uses clear visual cues (e.g., color-coded "OK" or "High" statuses) to flag critical results like design margin and nozzle momentum, allowing for rapid decision-making.
*   **Interactive TEMA Selector:** A custom-built UI component that visually displays an icon of the selected TEMA part, reducing ambiguity for engineers.

---

### **3. Screenshots**

*(This is where you would embed your images)*

**Image 1: The Secure Login Portal**
`[Insert Screenshot of login.html]`

**Image 2: Guided Thermal Analysis Page**
`[Insert Screenshot of thermal.html]`

**Image 3: Interactive Geometry & TEMA Selection**
`[Insert Screenshot of geometry.html]`

**Image 4: The Final, Consolidated Web Report**
`[Insert Screenshot of report.html]`

**Image 5: The Professional TEMA-Style Datasheet**
`[Insert Screenshot of datasheet.html]`

---

### **4. Technology Stack & Architecture**

The platform is built on a robust and scalable architecture using industry-standard technologies.

| Category      | Technology                                                                                                  |
| :------------ | :---------------------------------------------------------------------------------------------------------- |
| **Backend**   | **Python**, **Flask**, **Flask-SQLAlchemy**, **Flask-Login**, **Pandas**, **NumPy**                           |
| **Frontend**  | **HTML5**, **CSS3**, **JavaScript (ES6+)**, **Bootstrap 5**                                                 |
| **Database**  | **PostgreSQL** (Production), **SQLite** (Development)                                                       |
| **Tools**     | **Git**, **VS Code**, **pip & venv**                                                                        |

The system follows a classic **Client-Server architecture**, where the frontend (running in the browser) communicates with the backend via a **RESTful API**. This decoupling allows for independent development and scaling of the user interface and the core calculation engine.

---

### **5. Installation and Local Setup**

To run this project on a local machine, follow these steps.

#### **Prerequisites**
*   Python 3.8 or newer
*   Git for cloning the repository

#### **Setup Instructions**

1.  **Clone the Repository:**
    ```bash
    git clone [your-github-repo-link]
    cd [repository-folder-name]
    ```

2.  **Create and Activate a Virtual Environment:**
    *   **Windows:**
        ```bash
        python -m venv venv
        .\venv\Scripts\activate
        ```
    *   **macOS / Linux:**
        ```bash
        python3 -m venv venv
        source venv/bin/activate
        ```

3.  **Install Dependencies:**
    A `requirements.txt` file should be created from the project's dependencies.
    ```bash
    pip install Flask Flask-SQLAlchemy Flask-Login pandas numpy gunicorn
    # Then freeze to a requirements file
    pip freeze > requirements.txt
    ```
    Once the file exists, you can simply run:
    ```bash
    pip install -r requirements.txt
    ```

4.  **Configure Environment Variables (Optional but Recommended):**
    For security, the `SECRET_KEY` and `DATABASE_URL` are read from environment variables. For local development, you can proceed without this, as the app has defaults.

5.  **Initialize the Database:**
    The application includes a custom Flask command to create the database tables. Run this command once.
    ```bash
    flask init-db
    ```

6.  **Run the Application:**
    ```bash
    flask run
    ```
    The application will be available at `http://127.0.0.1:5000`.

---

### **6. Usage Workflow**

1.  **Register an Account:** The first user to register automatically becomes the **Admin**.
2.  **Login:** Access the platform using your credentials.
3.  **Project Details:** Begin by entering customer and project metadata.
4.  **Thermal Analysis:** Input the known process conditions. Leave up to two fields blank for the solver to calculate.
5.  **Geometry:** Define the physical construction of the heat exchanger.
6.  **Materials & Nozzles:** Select materials of construction and nozzle sizes.
7.  **Calculate & Review:** The "Final Performance" page will calculate and display all key metrics.
8.  **Generate Report:** Proceed to the `Final Report` page to view the consolidated results or generate the TEMA datasheet.

---

### **7. Project Roadmap & Future Enhancements**

This platform provides a solid foundation. Future development could include:
*   **Advanced Mechanical Design Module:** Integrate calculations for shell, channel, and tubesheet thickness based on ASME codes.
*   **Vibration Analysis:** Add a module to predict and flag potential flow-induced vibration issues.
*   **Live Fluid Property API:** Replace the static CSV data with a real-time API connection to a professional properties database (e.g., NIST REFPROP) for higher accuracy and a wider range of fluids.
*   **Cost Estimation Engine:** Develop a feature to provide a preliminary cost estimate based on the specified geometry and materials.
*   **3D Visualization:** Integrate a library like `three.js` to render a basic 3D model of the designed heat exchanger.
