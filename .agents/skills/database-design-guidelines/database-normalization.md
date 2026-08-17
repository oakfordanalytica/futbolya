---
description: Database normalization is a database design process that organizes data into specific table structures to improve data integrity, prevent anomalies and reduce redundancy.
title: What Is Database Normalization? | IBM
image: https://www.ibm.com/content/dam/connectedassets-adobe-cms/worldwide-content/stock-assets/adb-stk/ul/g/bc/94/adobestock_620080258.jpeg/_jcr_content/renditions/cq5dam.thumbnail.1280.1280.png
---

[  Artificial Intelligence ](https://www.ibm.com/think/artificial-intelligence) [  Compute and servers ](https://www.ibm.com/think/compute) [  IT automation ](https://www.ibm.com/think/it-automation) 

#  What is database normalization?

 

##  Authors

[ Alice Gomstyn ](https://www.ibm.com/think/author/alice-gomstyn.html) 

Staff Writer

IBM Think

[ Alexandra Jonker ](https://www.ibm.com/think/author/alexandra-jonkeribm-com) 

Staff Editor

IBM Think

##  What is database normalization?

#### Database normalization is a [database](https://www.ibm.com/think/topics/database) design process that organizes data into specific table structures. It helps to improve [data integrity](https://www.ibm.com/think/topics/data-integrity), prevent data anomalies, minimize [data redundancy](https://www.ibm.com/think/topics/data-redundancy) and bolster query performance.

#### 

Normalization optimizes tables in database management systems (DBMS) to meet what are known as normal forms: sets of rules governing how attributes are organized within a table. These rules are based largely on relationships between attributes (columns), including keys used for uniquely identifying rows.

##  Why is database normalization important?

At its core, database normalization—sometimes called data normalization—helps businesses and institutions more effectively organize, query and maintain large volumes of complex, interrelated and dynamic [data](https://www.ibm.com/think/topics/data). Though enterprises now generate and store data at an unprecedented scale, the need for database normalization isn’t new. It predates [cloud storage](https://www.ibm.com/think/topics/cloud-storage) and even the invention of [data warehouses](https://www.ibm.com/think/topics/data-warehouse).

Since the 1960s, corporations have struggled to manage large datasets. In the 1970s, [Edgar F. Codd](https://www.ibm.com/history/edgar-codd), the IBM mathematician known for his landmark paper [introducing relational databases](https://www.ibm.com/history/relational-database), proposed that database normalization could [avoid “undesirable” dependencies](https://forum.thethirdmanifesto.com/wp-content/uploads/asgarosforum/987737/00-efc-further-normalization.pdf) between attributes (columns) and the problems they can create.

In other words, when data records are related to each other in a [database](https://www.ibm.com/think/topics/database) structure, changes to single values or rows in a large, complicated table might yield unintended consequences—such as data inconsistency and data loss. Database normalization is designed to minimize such risks.

##  What are the benefits of database normalization?

The benefits of database normalization include:

 Prevention of data anomalies 

When larger, more complicated tables are decomposed (or divided) into smaller, simpler tables, altering a database becomes an easier, less error-prone process, and limits changes to the now-smaller tables of related data.

 Reduction of unintentional data redundancy 

While intentional [data redundancy](https://www.ibm.com/think/topics/data-redundancy) can help improve [data quality](https://www.ibm.com/think/topics/data-quality), [security](https://www.ibm.com/think/topics/data-security) and availability, uninentional data redundancy is the effect of systems inadvertently creating duplicate data, which results in inefficiencies.

 Data storage cost savings 

Reducing duplicate data through database normalization can lower [data storage](https://www.ibm.com/think/topics/data-storage) costs. This is especially important for [cloud](https://www.ibm.com/topics/cloud-computing) environments where pricing is often based on the volume of data storage used.

 Faster data retrieval 

Less data redundancy due to normalization can also lead to faster data queries as lower redundancy often requires less [data processing](https://www.ibm.com/think/topics/data-processing) during searches.

##  What data anomalies does database normalization address?

The normalization of data structures can prevent three key types of anomalies:

**Insertion anomalies:** An insertion anomaly occurs when a data record cannot be inserted into a table because it is missing values required by one or more columns in the table.

**Deletion anomalies:** A deletion anomaly occurs when the deletion of a record results in the unintentional deletion of important data included in that record.

**Update anomalies:** An update anomaly occurs when an instance of data is updated in one location in a database but not in other locations where that data value is also stored, resulting in a lack of data consistency.

##  The significance of keys in database normalization

In [relational databases](https://www.ibm.com/think/topics/relational-databases), a key is a column or an ordered collection of columns used to identify rows of data in a table. Keys in relational models also establish associations between related tables. These capabilities support successful, efficient [SQL database](https://www.ibm.com/think/topics/sql-vs-nosql) queries. Keys that figure prominently in database normalization rules include:

* **Primary keys**
* **Composite keys**
* **Candidate keys**
* **Foreign keys**
* **Super keys**

### Primary keys

A [primary key](https://www.ibm.com/think/topics/primary-key) is a column or columns in a [database](https://www.ibm.com/think/topics/database) table with values that serve as unique identifiers for each row or record. For example, a student ID column could be a primary key in a table of student information. Defining characteristics of primary keys are that they exclude null values, have no duplicate values and may consist of either single columns or multiple columns.

### Composite keys

Keys that consist of two or more columns are called composite keys. When primary keys are composite keys, they may be called composite primary keys.

### Candidate keys

A candidate key is a column or group of columns that has the characteristics of a primary key but has not been assigned primary key status.

### Foreign keys

A foreign key in one table refers to a specific primary key in another table in order to define a relationship between the tables. When larger tables are divided into smaller tables during normalization, foreign keys and primary keys establish an association between the new tables.

### Super keys

Super keys, while similar to composite primary keys, also consist of more columns than are necessary to uniquely identify records.

##  The significance of dependencies in database normalization

Several database normalization constraints are based on the relationships (also known as dependencies) between primary keys and columns that are neither primary nor candidate keys. The latter are known as non-key attributes or non-prime attributes.

Relationships between attributes in databases where one attribute (the determinant) determines the value of another attribute are known as functional dependencies. Types of functional dependencies between attributes include partial dependency, transitive dependency, multi-valued dependency and join dependency. These relationships are best understood when discussed in the context of relevant sets of normalization rules, or normal forms.

##  What are the normal forms of database normalization?

Executing normalization in data models involves designing tables to conform with one or more levels of normalization, also known as normal forms. Common forms include:

* **First normal form**
* **Second normal form**
* **Third normal form and Boyce-Codd Normal Form**
* **Fourth normal form**
* **Fifth normal form**

### First normal form

First normal form, the most basic database normalization criteria, requires that a database table schema includes a primary key while excluding repetition among columns. To be more specific, a table in first normal form should not have fields with arrays of values—for instance, a single cell with three different names in it—nor should it include repeating groups, which are different columns that store the same type of data.

To better understand first normal form, let’s use the following set of columns as an example:1

| **_rec\_num_** | **_lname_** | **_fname_** | **_bdate_** | **_anniv_** | **_email_** | **_child1_** | **_child2_** | **_child3_** |
| -------------- | ----------- | ----------- | ----------- | ----------- | ----------- | ------------ | ------------ | ------------ |

The columns comprise a table of a group of parents, including their names, birthdays, wedding anniversaries, emails and children’s names.

This table violates first normal form because it contains three separate columns storing the same type of information: children’s names. In this case in particular, the table structure could open the door to insertion errors. For example, in the real world, many parents have fewer than three children.

In our example table, it’s not possible to add such parents’ records to the table. In addition, querying this table for a child’s name would be inefficient, requiring searching data in three different columns in every row.

Achieving first normal form for the data in the table requires separating the original table into two. One table would include most of the attributes of the original table, while the other would focus on children.

_**TABLE 1**_

| **_rec\_num_** | **_lname_** | **_fname_** | **_bdate_** | **_anniv_** | **_email_** |
| -------------- | ----------- | ----------- | ----------- | ----------- | ----------- |

_**TABLE 2**_

_**rec\_num child\_name**_

In this example, the new tables remain linked through the “rec\_num” column, which is the primary key in Table 1 and is referenced by Table 2’s “rec\_num” column, which serves as a foreign key.

While satisfying first normal form might not reduce redundant data (“rec\_num” values will appear in multiple rows of Table 2 when parents have more than one child) the elimination of repeating groups can make queries simpler.

### Second normal form

In second normal form, no non-key attribute has a partial dependency on the primary key in the table. In other words, if a primary key is a composite key, the non-key attribute should depend on every column in that composite key.

For example, consider an inventory table that has records of quantities of specific parts that are stored at particular warehouses. The following figure shows the attributes of the inventory entity.2

| **_part_** | **_warehouse_** | **_quantity_** | **_warehouse\_address_** |
| ---------- | --------------- | -------------- | ------------------------ |

In this example, the “part” and “warehouse” columns form a composite primary key. However, the attribute “warehouse\_address” depends only on the value of “warehouse,” so the table violates second normal form.

This table is also prone to data redundancy, with the value for warehouse\_address listed each time a record for a part from the same warehouse appears in the table. This raises the risk of update errors should the address be updated in one row and not in others. A deletion error may also occur if any one warehouse stops storing parts—should records of those parts be deleted, the warehouse address would be deleted as well.

To satisfy second normal form and reduce the likelihood of errors, the data can be distributed between two new tables:

**_TABLE 1_**

| **_part_** | **_warehouse_** | **_quantity_** |
| ---------- | --------------- | -------------- |

**_TABLE 2_**

**_warehouse warehouse\_address_**

### Third normal form and Boyce-Codd Normal Form

A table in third normal form satisfies both first and second normal forms while also avoiding situations where non-key attributes depend on other non-key attributes instead of primary keys. When non-key attributes do depend on other non-key attributes, this is known as a transitive dependency—a violation of third normal form.

Consider the following table of employee information:3

| **_emp\_num_** | **_emp\_fname_** | **_emp\_lname_** | **_dept\_num_** | **_dept\_name_**       |
| -------------- | ---------------- | ---------------- | --------------- | ---------------------- |
| _0200_         | _David_          | _Brown_          | _D11_           | _Manufacturing System_ |
| _0320_         | _Ramlal_         | _Mehta_          | _E21_           | _Software Support_     |
| _0220_         | _Jennifer_       | _Lutz_           | _D11_           | _Manufacturing System_ |

In this table, the primary key is the “emp\_num” column. However, the “dept\_name” column depends on the “dept\_num” column, a non-key attribute. Therefore, the table does not meet third normal form and raises the risk of errors such as update anomalies—if a department name, such as “manufacturing system,” changed, it would have to be updated in more than one row under the current table schema.

Organizing the data into third normal form in a normalized database could prevent such errors. In this case, this process would entail structuring the data into three separate tables: _EMPLOYEE, DEPARTMENT, and EMPLOYEE\_DEPARTMENT 4_

**EMPLOYEE Table**

| **_emp\_num_** | **_emp\_fname_** | **_emp\_lname_** |
| -------------- | ---------------- | ---------------- |
| _0200_         | _David_          | _Brown_          |
| _0320_         | _Ramlal_         | _Mehta_          |
| _0220_         | _Jennifer_       | _Lutz_           |

**DEPARTMENT Table**

| **_dept\_num_** | **_dept\_name_**       |
| --------------- | ---------------------- |
| _D11_           | _Manufacturing System_ |
| _E21_           | _Software Support_     |

**EMPLOYEE\_DEPARTMENT Table**

| **_dept\_num_** | **_emp\_num_** |
| --------------- | -------------- |
| _D11_           | _0200_         |
| _D11_           | _0220_         |
| _E21_           | _0320_         |

Boyce-Codd Normal Form, or BCNF, is a normal form that is considered a stricter or stronger version of third normal form. BCNF requires the use of super keys.

### Fourth normal form

A table is in fourth normal form if it does not have multi-valued dependencies. Multi-valued dependencies occur when the values of two or more columns are independent of each other and only dependent on the primary key.

A commonly cited example in tutorials centers on employee tables listing both skills and languages. An employee can have several skills and speak multiple languages. Two relationships exist: one between employees and skills and one between employees and languages.

A table is not in fourth normal form if it represents both relationships. Converting the data into fourth normal form would require structuring it into two tables—one for employee skills and one for languages.

### Fifth normal form

Commonly considered the highest level of normalization, fifth normal form is a criterion centered on join dependency. In join dependency, after a table is divided into smaller tables, it is possible to reconstitute the original table by bringing the new tables back together again—all without losing any data or accidentally creating new rows of data. It is comparable to a completed jigsaw puzzle that, when broken apart, can be put back together into its original form.

In fifth normal form, a table should be divided into smaller tables only when join dependency is achievable. If, however, attempts to reconstitute the original table from smaller tables unintentionally leads to the creation of a slightly different table, then decomposition of the original table should not take place. Returning to our jigsaw puzzle analogy, it would be like putting a puzzle back together again, only to find a piece is missing or that an extra piece has materialized.

##  What are the challenges of database normalization?

For all its benefits, database normalization comes with trade-offs. For instance, prior to normalization, a user seeking specific data might only have to query one table. However, if a database has more tables following a normalization, the user may find themselves having to query multiple tables—which can be a slower and more expensive process.

Additionally, even as normalization makes individual tables simpler, it can increase the complexity of the database overall, requiring significant expertise on the part of database designers and administrators to ensure proper implementation.

 Link copied

[ ](https://www.linkedin.com/shareArticle?url=https://www.ibm.com/think/topics/database-normalization&title=Database%20normalization) [ ](https://www.facebook.com/share.php?u=https://www.ibm.com/think/topics/database-normalization) [ ](https://x.com/intent/tweet?text=Database%20normalization&url=https://www.ibm.com/think/topics/database-normalization) 

[   Report  The data leaders guide to AI-ready data 2026 Actionable steps you can take to get your organization's data AI-ready. ](https://www.ibm.com/forms/mkt-53325) 

##  Resources

[   Webinar | On demand  AI Agents run on data - is yours ready? Your data is your competitive edge. Learn how to unlock it securely and drive measurable ROI from AI in this short webinar. Watch now ](https://ibm.webcasts.com/starthere.jsp?ei=1740011&tp%5Fkey=ada6dc37d2&sti=inbound) 

[   Techsplainers Podcast  Data management explained Techsplainers by IBM breaks down the essentials of data for AI, from key concepts to real‑world use cases. Clear, quick episodes help you learn the fundamentals fast. Listen now ](https://www.ibm.com/think/podcasts/techsplainers#tabs-fw-44e285b2cc-item-16e8334e37-tab) 

[   Ebook  Unify and access your data to help scale your AI Learn why the path to AI-ready data often starts with effective access to both structured and unstructured data and the challenges that can impede data leaders. Read the ebook ](https://www.ibm.com/forms/mkt-54006) 

[   Case study  Legal overhead turned into strategic insight Learn how an AI-powered legal agent helps accelerate decision-making, reduce manual work and improve compliance. Read the case study ](https://www.ibm.com/case-studies/dynamiq) 

[   Video  AI Academy: Building a data strategy for enterprise AI In this episode, Cathy Reese explains how organizations today need a data strategy that’s ready for advanced AI, which will require them to harness their highest quality data assets. Watch the episode ](https://www.ibm.com/think/videos/ai-academy/building-data-strategy-enterprise-ai) 

[   Ebook  The hybrid, open data lakehouse for AI Simplify data access and automate data governance. Discover the power of integrating a data lakehouse strategy into your data architecture, including cost-optimizing your workloads and scaling AI and analytics, with all your data, anywhere. Read the ebook ](https://www.ibm.com/forms/mkt-52131) 

[   Report  Cost of a Data Breach Report 2025 Data breach costs have hit a new high. Get up-to-date insights into cybersecurity threats and their financial impacts on organizations. Read the report ](https://www.ibm.com/forms/mkt-53830) 

[   Guide  The data leader’s guide to AI-ready data Understand the actionable steps data leaders can take to overcome data challenges, establish the groundwork for a trusted data foundation and help get your organization’s data ready for AI. Read the guide ](https://www.ibm.com/forms/mkt-53325) 

[   Report  How the C-suite is turning information into impact Explore insights from 1,700 CDOs in this cross-industry report for data leaders. Read the report ](https://www.ibm.com/account/reg/signup?formid=urx-54212) 

 Related solutions 

 IBM® watsonx.data™ 

Watsonx.data enables you to scale analytics and AI with all your data, wherever it resides, through an open, hybrid and governed data store.

[  Discover watsonx.data ](https://www.ibm.com/products/watsonx-data) 

 Data management software and solutions 

Design a data strategy that eliminates data silos, reduces complexity and improves data quality for exceptional customer and employee experiences.

[  Discover data management solutions ](https://www.ibm.com/solutions/data-management) 

 Data and AI consulting services 

Successfully scale AI with the right strategy, data, security and governance in place.

[  Explore data and AI consulting services ](https://www.ibm.com/consulting/data-ai) 

Take the next step 

Unify all your data for AI and analytics with IBM® watsonx.data™. Put your data to work, wherever it resides, with the hybrid, open data lakehouse for AI and analytics.

1. [ ](https://www.ibm.com/products/watsonx-data)[ Discover watsonx.data ](https://www.ibm.com/products/watsonx-data)
2. [ ](https://www.ibm.com/solutions/data-management)[ Explore data management solutions ](https://www.ibm.com/solutions/data-management)

#####  Footnotes

1 “[First normal form](https://www.ibm.com/docs/en/informix-servers/15.0.x?topic=model-first-normal-form).” IBM Documentation, Informix Servers. 19 November 2024.

2, 3, 4 “[Normalization in database design](https://www.ibm.com/docs/en/db2-for-zos/13.0.0?topic=modeling-normalization-in-database-design).” IBM Documentation, Db2 for z/OS. 22 January 2025.

```json
{
              "@context": "https://schema.org",
              "@type": "NewsArticle",
              "headline": "Database normalization",
              "image": [
                  "https://www.ibm.com/content/dam/connectedassets-adobe-cms/worldwide-content/stock-assets/adb-stk/ul/g/bc/94/adobestock_620080258.jpeg"
              ],
              "datePublished": "",
              "dateModified": "2026-02-23T15:42:37.878Z",
              "author": [{"@type":"Person","name":"Alice Gomstyn","url":"https://www.ibm.com/think/author/alice-gomstyn.html"},{"@type":"Person","name":"Alexandra Jonker","url":"https://www.ibm.com/think/author/alexandra-jonkeribm-com"}]
          }
```
