import csv
import json

def csv_to_json(csv_file_path, json_file_path):
    data = []
    
    with open(csv_file_path, mode='r') as csv_file:
        csv_reader = csv.DictReader(csv_file)
        
        for row in csv_reader:
            # Convert specific columns to the right type
            country = str(row['Country'])
            capital = str(row['Capital City']) 
            latitude = float(row['Latitude']) 
            longitude =float(row['Longitude']) 
            population =int(row['Population']) 
            capital_type = str(row['Capital Type']) 
            data.append({"country":country,"capital":capital,"latitude":latitude,"longitude":longitude,"population":population,"capital_type":capital_type})
    
    with open(json_file_path, mode='w') as json_file:
        json.dump(data, json_file, indent=4)

# Example usage
csv_file_path = 'capitals.csv'
json_file_path = 'capitals.json'
csv_to_json(csv_file_path, json_file_path)