import smtplib

smtp_host = 'smtp.gmail.com'
smtp_port = 587
smtp_user = 'elangovanelangovan2003@gmail.com'
smtp_pass = 'qaqp vqyl jsav ivgw'

try:
    server = smtplib.SMTP(smtp_host, smtp_port)
    server.starttls()
    server.login(smtp_user, smtp_pass)
    print('SMTP login successful!')
    server.quit()
except Exception as e:
    print(f'Error: {e}')
