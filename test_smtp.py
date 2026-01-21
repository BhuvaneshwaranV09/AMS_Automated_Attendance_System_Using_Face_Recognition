import smtplib

smtp_host = '...........'
smtp_port = ...
smtp_user = '................'
smtp_pass = '...........'

try:
    server = smtplib.SMTP(smtp_host, smtp_port)
    server.starttls()
    server.login(smtp_user, smtp_pass)
    print('SMTP login successful!')
    server.quit()
except Exception as e:
    print(f'Error: {e}')
