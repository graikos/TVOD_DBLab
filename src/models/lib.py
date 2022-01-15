
def get_value_tuple(array):
    vals = []

    for row in array:
        for item in row:
            vals.append(item)

    return tuple(vals)


# table_name: name of table for insert query
# values_list: list of iterables, each representing a row to insert
# table_cols: columns to populate; if None is passed, all columns of table will be populated
def pack_values_into_sql_insert(table_name, total_rows, total_columns, table_cols=None):
    if not total_rows:
        return None

    query = f"INSERT INTO {table_name} "

    row_str = ""

    if table_cols:
        row_str = "("
        for column in table_cols:
            row_str += column + ","
        
        row_str = row_str[:-1]
        row_str += ")"

    query += row_str + " VALUES "

    for _ in range(total_rows):
        query += build_row(total_columns) + ", "

    return query[:-2]



def build_row(total_columns):
    row_str = "("
    for _ in range(total_columns):
        row_str += "%s,"
    
    row_str = row_str[:-1]
    row_str += ")"

    return row_str
